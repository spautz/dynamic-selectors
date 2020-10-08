import {
  DynamicSelectorArgsWithoutState,
  DynamicSelectorArgsWithState,
  DynamicSelectorFn,
  DynamicSelectorInnerFn,
  DynamicSelectorOptions,
  DynamicSelectorParams,
  DynamicSelectorStateOptions,
} from './types';

import {
  CALL_STACK_ENTRY__DEPENDENCIES,
  CALL_STACK_ENTRY__STATE,
  CALL_STACK_ENTRY__STATE_OPTIONS,
  RESULT_ENTRY__DEBUG_INFO,
  RESULT_ENTRY__ERROR,
  RESULT_ENTRY__HAS_RETURN_VALUE,
  RESULT_ENTRY__RETURN_VALUE,
  RESULT_ENTRY__STATE,
  DynamicSelectorDebugInfo,
  DynamicSelectorDependencyEntry,
  DynamicSelectorResultCache,
  DynamicSelectorResultEntry,
  createDependencyEntry,
  createResultEntry,
  debugAbortedRun,
  debugFullRun,
  debugInvoked,
  debugPhantomRun,
  debugSkippedRun,
  getTopCallStackEntry,
  popCallStackEntry,
  pushCallStackEntry,
} from './internals';

const dynamicSelectorForState = <StateType = any>(
  stateOptions: DynamicSelectorStateOptions<StateType>,
) => {
  const { compareState, get, defaultSelectorOptions } = stateOptions;

  console.log('dynamicSelectorForState()', stateOptions);

  const hasAnyDependencyChanged = (
    state: StateType,
    previousDependencies: Array<DynamicSelectorDependencyEntry>,
    otherArgs: Array<any>,
  ): boolean => {
    const dependencyListLength = previousDependencies.length;
    for (let i = 0; i < dependencyListLength; i += 1) {
      const [
        dependencySelectorOrStatePath,
        dependencyParams,
        dependencyReturnValue,
      ] = previousDependencies[i];

      if (
        typeof dependencySelectorOrStatePath === 'string' ||
        Array.isArray(dependencySelectorOrStatePath)
      ) {
        // There's some direct state access: if the accessed value in state is new, we need to know
        const [path, previousStateValue] = dependencySelectorOrStatePath;
        const currentStateValue = get(state, path);
        if (currentStateValue !== previousStateValue) {
          return true;
        }
      } else {
        // Does our dependency have anything new? Let's run it to find out.
        const result = dependencySelectorOrStatePath._runWithState(
          state,
          dependencyParams,
          ...otherArgs,
        );
        const [, , hasReturnValue, newReturnValue] = result;

        if (hasReturnValue && newReturnValue !== dependencyReturnValue) {
          // Something returned a new value: that's a real chance
          return true;
        }
      }
    }
    return false;
  };

  /**
   * If the selector is called from within another selector, in the same 'universe' (stateOptions), then we need
   * to
   *
   * Most of the 'public' entry points can be called from either a "with state" context or a "without state"
   * context. We use this to avoid doubling the argument-massaging logic in each of them.
   */
  const getFullArguments = (
    args: DynamicSelectorArgsWithState<StateType> | DynamicSelectorArgsWithoutState,
  ): DynamicSelectorArgsWithState<StateType> => {
    const parentCaller = getTopCallStackEntry();

    if (parentCaller) {
      if (parentCaller[CALL_STACK_ENTRY__STATE_OPTIONS] !== stateOptions) {
        // @TODO: Better error message/explanation, and add a way to mute it
        console.error(
          'A selector for one state is being called from a selector for a different state: this is probably a bug',
        );
        return args as DynamicSelectorArgsWithState;
      }
      const state = parentCaller[CALL_STACK_ENTRY__STATE];
      return [state, ...args] as DynamicSelectorArgsWithState;
    }

    // When called from outside (i.e., from mapStateToProps) the state will to be provided.
    return args as DynamicSelectorArgsWithState;
  };

  const createDynamicSelector = <ReturnType = any>(
    innerFn: DynamicSelectorInnerFn<ReturnType>,
    options?: Partial<DynamicSelectorOptions<ReturnType, StateType>>,
  ): DynamicSelectorFn<ReturnType> => {
    const { compareResult, createResultCache, displayName, getKeyForParams, onException } = options
      ? { ...defaultSelectorOptions, ...options }
      : defaultSelectorOptions;

    console.log('createDynamicSelector()', options);

    const resultCache: DynamicSelectorResultCache = createResultCache();

    let dynamicSelectorFn: DynamicSelectorFn;

    ///////////////////////////////////////////////////////////////////////////
    // The main algorithm

    /*
     * This is the core function for the selector: the different entry points all run this.
     */
    const evaluateSelector = (
      state: StateType,
      params: DynamicSelectorParams,
      ...otherArgs: Array<any>
    ): DynamicSelectorResultEntry => {
      const paramKey = getKeyForParams(params);
      const previousResult = resultCache.get(paramKey);
      let thisResult: DynamicSelectorResultEntry = createResultEntry(state, previousResult);
      const parentCaller = getTopCallStackEntry();

      const debugInfo = thisResult[RESULT_ENTRY__DEBUG_INFO];

      debugInvoked(debugInfo);

      // Do we have a prior result we can use?
      let canUsePreviousResult = false;
      if (previousResult) {
        const [previousState, previousDependencies, hasPreviousReturnValue] = previousResult;

        if (hasPreviousReturnValue) {
          if (state && previousState && compareState && compareState(previousState, state)) {
            // We've already run with these params and this state
            canUsePreviousResult = true;
          } else {
            // Have any of our dependencies changed?
            pushCallStackEntry(stateOptions, state);
            canUsePreviousResult = !hasAnyDependencyChanged(state, previousDependencies, otherArgs);
            popCallStackEntry();
          }

          if (canUsePreviousResult) {
            // The cache is good!
            debugSkippedRun(debugInfo);
            // Mutate the previous result to apply the current state. This may help memory usage and
            // future checks.
            previousResult[RESULT_ENTRY__STATE] = state;
            // We still need to register this selectorFn as a dependency of the parent (if any)
            if (parentCaller) {
              const dependencyEntry = createDependencyEntry(
                dynamicSelectorFn,
                params,
                previousResult[RESULT_ENTRY__RETURN_VALUE],
              );
              parentCaller[CALL_STACK_ENTRY__DEPENDENCIES].push(dependencyEntry);
            }
            return previousResult;
          }
        }
      }

      // If we reach this point, the previousResult could not be used: we MUST run
      const getState = (path: string | Array<string>, defaultValue: any) => {
        const stateValue = get(state, path, defaultValue);

        // Mark this dependency on ourselves
        const thisCallStackEntry = getTopCallStackEntry()!;

        const dependencyEntry = createDependencyEntry(path, params, stateValue);
        thisCallStackEntry[CALL_STACK_ENTRY__DEPENDENCIES].push(dependencyEntry);

        return stateValue;
      };

      let newReturnValue: any;
      try {
        newReturnValue = innerFn(getState, params, ...otherArgs);
      } catch (e) {
        debugAbortedRun(debugInfo);

        // @TODO: Mark results

        if (onException) {
          newReturnValue = onException(e, [state, params, ...otherArgs], dynamicSelectorFn);
        } else {
          thisResult[RESULT_ENTRY__ERROR] = e;
        }
      }

      if (!thisResult[RESULT_ENTRY__ERROR]) {
        // Did the return value *really* change?
        if (
          previousResult &&
          previousResult[RESULT_ENTRY__HAS_RETURN_VALUE] &&
          compareResult(previousResult[RESULT_ENTRY__RETURN_VALUE], newReturnValue)
        ) {
          // It's not actually different: just use the old one (phantom run: return value is not changed)
          debugPhantomRun(debugInfo);
          thisResult = previousResult!;
          thisResult[RESULT_ENTRY__STATE] = state;
        } else {
          // It *is* different: we truly re-ran and generated a new value
          debugFullRun(debugInfo);
          thisResult[RESULT_ENTRY__HAS_RETURN_VALUE] = true;
          thisResult[RESULT_ENTRY__RETURN_VALUE] = newReturnValue;
        }
      }

      resultCache.set(paramKey, thisResult);
      return thisResult;
    };

    /*
     * This is the 'public' selector function. You can call it like normal and it behaves like a normal function;
     * it's just a straightforward wrapper around evaluateParameterizedSelector for handling the common case.
     */
    dynamicSelectorFn = ((
      ...args: DynamicSelectorArgsWithState | DynamicSelectorArgsWithoutState
    ): ReturnType => {
      const isNewStart = !getTopCallStackEntry();
      const argsWithState = getFullArguments(args);

      if (isNewStart) {
        pushCallStackEntry(stateOptions, argsWithState[0]);
      }
      const result = evaluateSelector(...argsWithState);
      if (isNewStart) {
        popCallStackEntry();
      }

      if (result[RESULT_ENTRY__ERROR]) {
        throw result[RESULT_ENTRY__ERROR];
      }
      return result[RESULT_ENTRY__RETURN_VALUE];
    }) as DynamicSelectorFn;

    ///////////////////////////////////////////////////////////////////////////
    // Additional properties attached to the 'public' selector function

    /**
     * DO NOT USE THIS.
     * This lets selectors bypass the wrappers internally, when appropriate. It shouldn't be called from outside of
     * this file, except in tests.
     */
    dynamicSelectorFn._runWithState = evaluateSelector;

    /**
     * This is only for debugging purposes
     */
    dynamicSelectorFn._innerFn = innerFn;

    dynamicSelectorFn.getDebugInfo = (params: DynamicSelectorParams): DynamicSelectorDebugInfo => {
      const paramKey = getKeyForParams(params);
      const resultEntry = resultCache.get(paramKey);
      if (resultEntry) {
        return resultEntry[RESULT_ENTRY__DEBUG_INFO];
      }
      return null;
    };

    dynamicSelectorFn.hasCachedResult = (/* params: DynamicSelectorParams */) => {
      // @TODO
      return false;
    };

    dynamicSelectorFn.isParameterizedSelector = true;

    dynamicSelectorFn.displayName = displayName || innerFn.displayName || innerFn.name;

    return dynamicSelectorFn;
  };

  return createDynamicSelector;
};

export { dynamicSelectorForState };
