import {
  DynamicSelectorFn,
  DynamicSelectorInnerFn,
  DynamicSelectorOptions,
  DynamicSelectorStateOptions,
} from './types';

import {
  createDebugInfo,
  debugInvoked,
  debugSkippedRun,
  debugPhantomRun,
  debugFullRun,
  debugAbortedRun,
  DynamicSelectorResultCache,
  DynamicSelectorResultEntry,
  RESULT_ENTRY__DEBUG_INFO,
  RESULT_ENTRY__STATE,
  RESULT_ENTRY__HAS_RETURN_VALUE,
  RESULT_ENTRY__RETURN_VALUE,
} from './internals';

const dynamicSelectorForState = <StateType = any>(
  stateOptions: DynamicSelectorStateOptions<StateType>,
) => {
  const { compareState, get, defaultSelectorOptions } = stateOptions;

  console.log('dynamicSelectorForState()', stateOptions);

  const createDynamicSelector = <ReturnType = any>(
    innerFn: DynamicSelectorInnerFn<ReturnType>,
    options?: Partial<DynamicSelectorOptions<ReturnType, StateType>>,
  ): DynamicSelectorFn<ReturnType> => {
    const { compareResult, createResultCache, getKeyForParams, onException } = options
      ? { ...defaultSelectorOptions, ...options }
      : defaultSelectorOptions;

    console.log('createDynamicSelector()', options);

    const resultCache: DynamicSelectorResultCache = createResultCache();

    /*
     * This is the core function for the selector: the different entry points all run this
     */
    const evaluateSelector: DynamicSelectorFn<ReturnType> = (state, params, ...otherArgs) => {
      const paramKey = getKeyForParams(params);
      const previousResult = resultCache.get(paramKey);
      let thisResult: DynamicSelectorResultEntry = previousResult
        ? [...previousResult]
        : [state, [], false, undefined, createDebugInfo()];

      const debugInfo = thisResult[RESULT_ENTRY__DEBUG_INFO];

      debugInvoked(debugInfo);

      // Do we have a prior result we can use?
      let canUsePreviousResult = false;

      if (previousResult) {
        const [
          previousState,
          ,
          // previousDependencies,
          hasPreviousReturnValue,
          previousReturnValue,
        ] = previousResult;

        if (hasPreviousReturnValue) {
          if (state && previousState && compareState && compareState(previousState, state)) {
            // We've already run with these params and this state
            canUsePreviousResult = true;

            debugSkippedRun(debugInfo);
          } else {
            // @TODO: Have any of our dependencies changed?
          }
        }

        if (canUsePreviousResult) {
          // The cache is good!
          // DANGER: We're mutating the previous result to apply the current state. This may help memory usage and
          // future checks.
          previousResult[RESULT_ENTRY__STATE] = state;

          return previousReturnValue;
        } else {
          // Prepare for run
          thisResult[RESULT_ENTRY__STATE] = state;
        }
      }

      // If we reach this point, the previousResult could not be used: we MUST run
      // @TODO: Merge with above block to handle "ran but result is not new" (phantom) case

      let newReturnValue: any;
      try {
        newReturnValue = innerFn(get.bind(undefined, state), params, ...otherArgs);
      } catch (e) {
        debugAbortedRun(debugInfo);

        // @TODO: Mark results

        if (onException) {
          onException(e, [state, params, ...otherArgs]);
        } else {
          throw e;
        }
      }

      // Did the return value *really* change?
      if (
        previousResult &&
        previousResult[RESULT_ENTRY__HAS_RETURN_VALUE] &&
        compareResult(previousResult[RESULT_ENTRY__RETURN_VALUE], newReturnValue)
      ) {
        // It's not actually different: just use the old one (phantom run: return value is not changed)
        debugPhantomRun(debugInfo);
        thisResult = previousResult!;
      } else {
        thisResult[RESULT_ENTRY__RETURN_VALUE] = newReturnValue;
        debugFullRun(debugInfo);
      }

      return thisResult[RESULT_ENTRY__RETURN_VALUE];
    };

    return evaluateSelector;
  };

  return createDynamicSelector;
};

export { dynamicSelectorForState };
