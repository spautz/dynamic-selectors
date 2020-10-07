import {
  DynamicSelectorFn,
  DynamicSelectorInnerFn,
  DynamicSelectorOptions,
  DynamicSelectorStateOptions,
} from './types';

type DynamicSelectorDependencyEntry = [
  /* selectorFn */
  DynamicSelectorFn,
  /* paramString */
  string,
  /* returnValue */
  any,
];

// @TODO:
// type DynamicSelectorCallStackEntry = [
//   /* stateOptions (used to indicate the 'universe' this selector lives in) */
//   DynamicSelectorStateOptions,
//   /* state */
//   any,
//   /* dependencies recorded on last run */
//   Array<DynamicSelectorDependencyEntry>,
// ];

type DynamicSelectorDebugResult =
  | [
      /* invokeCount: how many times the selectorFn was called */
      number,
      /* skippedRunCount: how many times we avoided running innerFn because its result was in cache */
      number,
      /* phantomRunCount: how many times we ran innerFn but discarded its result due to no change */
      number,
      /* fullRunCount: how many times we ran innerFn and it returned a new result */
      number,
      /* abortedRunCount: how many times we ran innerFn but it threw an error */
      number,
    ]
  | null;
// These keys just make the DebugResult code easier to read
const DEBUG_RESULT_INVOKE_COUNT = 0;
const DEBUG_RESULT_SKIPPED_RUN_COUNT = 1;
const DEBUG_RESULT_PHANTOM_RUN_COUNT = 2;
const DEBUG_RESULT_FULL_RUN_COUNT = 3;
// const DEBUG_RESULT_ABORTED_RUN_COUNT = 4;

type DynamicSelectorResultEntry = [
  /* lastState */
  any,
  /* dependencies */
  Array<DynamicSelectorDependencyEntry>,
  /* hasLastReturnValue */
  boolean,
  /* lastReturnValue */
  any,
  /* debugResult */
  DynamicSelectorDebugResult,
];
// These keys just make the ResultEntry code easier to read
const RESULT_ENTRY_STATE = 0;
// const RESULT_ENTRY_DEPENDENCIES = 1;
const RESULT_ENTRY_HAS_RETURN_VALUE = 2;
const RESULT_ENTRY_RETURN_VALUE = 3;
const RESULT_ENTRY_DEBUG_RESULT = 4;

/**
 * When any Dynamic Selector is run, its info is pushed onto this stack. Then, *other* Dynamic Selectors which get
 * called will be registered as its dependencies. *
 * This single instance is used forever across all selectors.
 */
// const callStack: Array<DynamicSelectorCallStackEntry> = [];

const dynamicSelectorForState = <StateType = any>(
  stateOptions: DynamicSelectorStateOptions<StateType>,
) => {
  const { compareState, get, defaultSelectorOptions } = stateOptions;

  console.log('dynamicSelectorForState()', stateOptions);

  const resultCache: Record<string, DynamicSelectorResultEntry> = {};

  const createDynamicSelector = <ReturnType = any>(
    innerFn: DynamicSelectorInnerFn<ReturnType>,
    options?: Partial<DynamicSelectorOptions<ReturnType, StateType>>,
  ): DynamicSelectorFn<ReturnType> => {
    const { compareResult, debug, getKeyForParams /* onException */ } = options
      ? { ...defaultSelectorOptions, ...options }
      : defaultSelectorOptions;

    console.log('createDynamicSelector()', options);

    /*
     * This is the core function for the selector: the different entry points all run this
     */
    const evaluateSelector: DynamicSelectorFn<ReturnType> = (state, params, ...otherArgs) => {
      const paramKey = getKeyForParams(params);
      const previousResult = resultCache[paramKey];
      let thisResult: DynamicSelectorResultEntry = previousResult;

      // Do we have a prior result we can use?
      let canUsePreviousResult = false;

      if (previousResult) {
        const [
          previousState,
          ,
          // previousDependencies,
          hasPreviousReturnValue,
          previousReturnValue,
          debugResult,
        ] = previousResult;

        if (hasPreviousReturnValue) {
          if (process.env.NODE_ENV !== 'production' && debugResult) {
            debugResult[DEBUG_RESULT_INVOKE_COUNT]++;
          }

          if (state && previousState && compareState && compareState(previousState, state)) {
            // We've already run with these params and this state
            canUsePreviousResult = true;

            if (process.env.NODE_ENV !== 'production' && debugResult) {
              debugResult[DEBUG_RESULT_SKIPPED_RUN_COUNT]++;
            }
          } else {
            // @TODO: Have any of our dependencies changed?
          }
        }

        if (canUsePreviousResult) {
          // The cache is good!
          // DANGER: We're mutating the previous result to apply the current state. This may help memory usage and
          // future checks.
          previousResult[RESULT_ENTRY_STATE] = state;

          return previousReturnValue;
        } else {
          // Prepare for run
          thisResult[RESULT_ENTRY_STATE] = state;
        }
      } else {
        // No previous result
        thisResult = [state, [], false, undefined, debug ? [1, 0, 0, 0, 0] : null];
      }
      const debugResult = thisResult[RESULT_ENTRY_DEBUG_RESULT];

      // If we reach this point, the previousResult could not be used: we MUST run
      // @TODO: Merge with above block to handle "ran but result is not new" (phantom) case

      const newReturnValue = innerFn(get.bind(undefined, state), params, ...otherArgs);
      // If we reach this point without error, all is well

      // Did the return value *really* change?
      if (
        thisResult[RESULT_ENTRY_HAS_RETURN_VALUE] &&
        compareResult(thisResult[RESULT_ENTRY_RETURN_VALUE], newReturnValue)
      ) {
        // It's not actually different: just use the old one (phantom run: return value is not changed)
        if (process.env.NODE_ENV !== 'production' && debugResult) {
          debugResult[DEBUG_RESULT_PHANTOM_RUN_COUNT]++;
        }
      } else {
        thisResult[RESULT_ENTRY_RETURN_VALUE] = newReturnValue;
        if (process.env.NODE_ENV !== 'production' && debugResult) {
          debugResult[DEBUG_RESULT_FULL_RUN_COUNT]++;
        }
      }

      return thisResult[RESULT_ENTRY_RETURN_VALUE];
    };

    return evaluateSelector;
  };

  return createDynamicSelector;
};

export default dynamicSelectorForState;
