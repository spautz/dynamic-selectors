import {
  RESULT_ENTRY__STATE_OPTIONS,
  RESULT_ENTRY__STATE,
  RESULT_ENTRY__ALLOW_EXECUTION,
  RESULT_ENTRY__RECORD_DEPENDENCIES,
  RESULT_ENTRY__STATE_DEPENDENCIES,
  RESULT_ENTRY__CALL_DEPENDENCIES,
  RESULT_ENTRY__HAS_RETURN_VALUE,
  RESULT_ENTRY__RETURN_VALUE,
  RESULT_ENTRY__ERROR,
  RESULT_ENTRY__DEBUG_INFO,
  DynamicSelectorDebugInfo,
  DynamicSelectorResultCache,
  DynamicSelectorResultEntry,
  createCallDependency,
  createResultEntry,
  debugAbortedRun,
  debugDepCheck,
  debugFullRun,
  debugInvoked,
  debugPhantomRun,
  debugSkippedRun,
  getTopCallStackEntry,
  hasAnyCallDependencyChanged,
  hasAnyStateDependencyChanged,
  popCallStackEntry,
  pushCallStackEntry,
} from './internals';
import {
  DynamicSelectorArgsWithoutState,
  DynamicSelectorArgsWithState,
  DynamicSelectorFn,
  DynamicSelectorInnerFn,
  DynamicSelectorOptions,
  DynamicSelectorParams,
  DynamicSelectorStateAccessor,
  DynamicSelectorStateOptions,
} from './types';

const dynamicSelectorForState = <StateType = any>(
  stateOptions: DynamicSelectorStateOptions<StateType>,
) => {
  const { compareState, get, defaultSelectorOptions } = stateOptions;

  /**
   * If the selector is called from within another selector, in the same 'universe' (stateOptions), then we need
   * to prepend `state` to its arguments.
   *
   * Most of the 'public' entry points can be called from either a "with state" context or a "without state"
   * context. We use this to avoid doubling the argument-massaging logic in each of them.
   */
  const addStateToArguments = (
    args: DynamicSelectorArgsWithState<StateType> | DynamicSelectorArgsWithoutState,
  ): DynamicSelectorArgsWithState<StateType> => {
    const parentCaller = getTopCallStackEntry();

    if (parentCaller) {
      if (parentCaller[RESULT_ENTRY__STATE_OPTIONS] !== stateOptions) {
        // @TODO: Better error message/explanation, and add a way to mute it
        console.error(
          'A selector for one state is being called from a selector for a different state: this is probably a bug',
        );
        return args as DynamicSelectorArgsWithState;
      }
      const state = parentCaller[RESULT_ENTRY__STATE];
      return [state, ...args] as DynamicSelectorArgsWithState;
    }

    // When called from outside (i.e., from mapStateToProps) the state will to be provided.
    return args as DynamicSelectorArgsWithState;
  };

  const createDynamicSelector = <ReturnType = any>(
    innerFn: DynamicSelectorInnerFn<ReturnType>,
    options?: Partial<DynamicSelectorOptions<ReturnType, StateType>>,
  ): DynamicSelectorFn<ReturnType> => {
    const {
      compareResult,
      createResultCache,
      debug,
      displayName,
      getKeyForParams,
      onException,
    } = options ? { ...defaultSelectorOptions, ...options } : defaultSelectorOptions;

    const resultCache: DynamicSelectorResultCache = createResultCache();

    let outerFn: DynamicSelectorFn;

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
      const parentCaller = getTopCallStackEntry();

      const recordDependencies = parentCaller[RESULT_ENTRY__RECORD_DEPENDENCIES];
      const allowExecution = parentCaller[RESULT_ENTRY__ALLOW_EXECUTION];

      let nextResult: DynamicSelectorResultEntry = createResultEntry(
        stateOptions,
        state,
        allowExecution,
        recordDependencies,
        previousResult,
      );

      // When called as part of the call-dependency-check of another selector, we only log a depCheck instead of
      // a full invoke and result
      let debugInfo: DynamicSelectorDebugInfo = null;

      if (process.env.NODE_ENV !== 'production') {
        debugInfo = nextResult[RESULT_ENTRY__DEBUG_INFO];
        if (!debugInfo) {
          console.error('Internal error: no debugInfo for dynamic selector in development mode');
        } else {
          debugInfo._verbose = debug && (typeof debug === 'string' ? debug : displayName);

          if (recordDependencies && allowExecution) {
            debugInvoked(debugInfo);
          } else {
            debugDepCheck(debugInfo);
          }
        }
      }

      // Do we have a prior result we can use?
      let canUsePreviousResult = false;
      if (previousResult) {
        const [
          ,
          previousState,
          ,
          ,
          previousStateDependencies,
          previousCallDependencies,
          hasPreviousReturnValue,
        ] = previousResult;

        /* istanbul ignore next */
        if (false) {
          // This block is here ONLY to catch possible errors if the structure of `previousResult` changes
          const checkType_previousState: DynamicSelectorResultEntry[typeof RESULT_ENTRY__STATE] = previousState;
          const checkType_previousStateDependencies: DynamicSelectorResultEntry[typeof RESULT_ENTRY__STATE_DEPENDENCIES] = previousStateDependencies;
          const checkType_previousCallDependencies: DynamicSelectorResultEntry[typeof RESULT_ENTRY__CALL_DEPENDENCIES] = previousCallDependencies;
          const checkType_hasPreviousReturnValue: DynamicSelectorResultEntry[typeof RESULT_ENTRY__HAS_RETURN_VALUE] = hasPreviousReturnValue;
          console.log({
            checkType_previousState,
            checkType_previousStateDependencies,
            checkType_previousCallDependencies,
            checkType_hasPreviousReturnValue,
          });
        }

        if (hasPreviousReturnValue) {
          if (compareState && compareState(previousState, state)) {
            // We've already run with these params and this state
            canUsePreviousResult = true;
          } else {
            // Have any of our dependencies changed?
            canUsePreviousResult =
              !hasAnyStateDependencyChanged(get, state, previousStateDependencies) &&
              !hasAnyCallDependencyChanged(
                state,
                previousCallDependencies,
                allowExecution,
                otherArgs,
              );
          }
        }
      }

      // debugLogVerbose(debugInfo, 'canUsePreviousResult?', canUsePreviousResult, previousResult);

      // This is the block where we decide what the overall result was: skipped, phantom, full, or aborted
      if (canUsePreviousResult && previousResult) {
        debugSkippedRun(debugInfo);
        // Mutate the previous result to apply the current state. This may help memory usage and future checks.
        previousResult[RESULT_ENTRY__STATE] = state;
        // And just discard our 'new' result because we don't need it
        nextResult = previousResult;
      } else if (allowExecution) {
        // If we reach this point, the previousResult could not be used: we MUST run

        // Any calls to getState while run will register a state dependency on ourselves / our result
        const getState: DynamicSelectorStateAccessor = (path, defaultValue) => {
          let stateValue;
          if (path) {
            stateValue = get(state, path, defaultValue);
          } else {
            stateValue = state;
          }
          nextResult[RESULT_ENTRY__STATE_DEPENDENCIES][path || ''] = stateValue;
          return stateValue;
        };

        // Any calls to other selectors will register a call dependency on ourselves / our result
        pushCallStackEntry(nextResult);
        try {
          nextResult[RESULT_ENTRY__RETURN_VALUE] = innerFn(getState, params, ...otherArgs);
          nextResult[RESULT_ENTRY__HAS_RETURN_VALUE] = true;
        } catch (e) {
          nextResult[RESULT_ENTRY__ERROR] = e;

          if (onException) {
            // If the onException callback returns anything, we'll use that as the return value -- but we still
            // track the error.
            nextResult[RESULT_ENTRY__RETURN_VALUE] = onException(
              e,
              [state, params, ...otherArgs],
              outerFn,
            );
            // If a value wasn't returned, make sure we don't reuse it for future cache checks
            nextResult[RESULT_ENTRY__HAS_RETURN_VALUE] =
              nextResult[RESULT_ENTRY__RETURN_VALUE] !== undefined;
          }
        }
        popCallStackEntry();

        // We were able to run without error -- but is our "new" result actually new?
        if (!nextResult[RESULT_ENTRY__HAS_RETURN_VALUE]) {
          debugAbortedRun(debugInfo);
        } else if (
          compareResult &&
          previousResult &&
          previousResult[RESULT_ENTRY__HAS_RETURN_VALUE] &&
          nextResult[RESULT_ENTRY__HAS_RETURN_VALUE] &&
          compareResult(
            previousResult[RESULT_ENTRY__RETURN_VALUE],
            nextResult[RESULT_ENTRY__RETURN_VALUE],
          )
        ) {
          canUsePreviousResult = true;
          debugPhantomRun(debugInfo);
          // Carry over the *exact* return value we had before
          nextResult[RESULT_ENTRY__RETURN_VALUE] = previousResult[RESULT_ENTRY__RETURN_VALUE];
        } else {
          debugFullRun(debugInfo);
        }
      }
      // Else: we needed to run, but we're in a read-only depCheck. Oh well.

      // At this point we're done with *this* selector: nextResult has everything we need, and debugInfo has been logged.

      // We still need to register this selectorFn as a dependency of the parent (if any).
      if (recordDependencies) {
        parentCaller[RESULT_ENTRY__CALL_DEPENDENCIES].push(
          createCallDependency(
            outerFn,
            params,
            nextResult[RESULT_ENTRY__RETURN_VALUE],
            !allowExecution,
          ),
        );
      }

      resultCache.set(paramKey, nextResult);
      return nextResult;
    };

    /*
     * This is the 'public' selector function. You can call it like normal and it behaves like a normal function;
     * it's just a straightforward wrapper around evaluateSelector for handling the common case.
     */
    outerFn = ((
      ...args: DynamicSelectorArgsWithState | DynamicSelectorArgsWithoutState
    ): ReturnType => {
      const isNewStart = !getTopCallStackEntry();
      const argsWithState = addStateToArguments(args);

      if (isNewStart) {
        // This makes the rest of the code much simpler: put a fake entry onto the call stack.
        // That way, the selectorFn does not know whether or not it's the root, and we don't need to wrap all its
        // stack-related and dependency-related work in if/else blocks.
        const rootResult = createResultEntry(stateOptions, argsWithState[0], true, true);
        pushCallStackEntry(rootResult);
      }
      const result = evaluateSelector(...argsWithState);
      if (isNewStart) {
        popCallStackEntry();
      }

      // It's okay to have *both* an error *and* a return value (although that's rare: it only happens if onException
      // returned a value)
      if (!result[RESULT_ENTRY__HAS_RETURN_VALUE] && result[RESULT_ENTRY__ERROR]) {
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
     *
     * "dc" = "DepCheck"
     */
    outerFn._dc = evaluateSelector;

    /**
     * DO NOT USE THIS.
     * This is only for debugging purposes
     */
    outerFn._innerFn = innerFn;

    outerFn.getDebugInfo = (params: DynamicSelectorParams): DynamicSelectorDebugInfo => {
      if (process.env.NODE_ENV !== 'production') {
        const paramKey = getKeyForParams(params);
        const resultEntry = resultCache.get(paramKey);
        if (resultEntry) {
          return resultEntry[RESULT_ENTRY__DEBUG_INFO];
        }
      }
      return null;
    };

    // Common code for getCachedResult & hasCachedResult
    const evaluateSelectorReadOnly = (
      args: DynamicSelectorArgsWithState | DynamicSelectorArgsWithoutState,
    ): DynamicSelectorResultEntry => {
      const argsWithState = addStateToArguments(args);
      const rootResult = createResultEntry(stateOptions, argsWithState[0], false, false);

      pushCallStackEntry(rootResult);
      const result = evaluateSelector(...argsWithState);
      popCallStackEntry();

      const parentCaller = getTopCallStackEntry();
      if (parentCaller && parentCaller[RESULT_ENTRY__RECORD_DEPENDENCIES]) {
        parentCaller[RESULT_ENTRY__CALL_DEPENDENCIES].push(
          createCallDependency(
            outerFn,
            argsWithState[1],
            result[RESULT_ENTRY__RETURN_VALUE],
            false,
          ),
        );
      }

      return result;
    };

    /**
     * This is just like the main outerFn, except it prohibits all selectors (this and its dependencies) from
     * re-executing.
     */
    outerFn.getCachedResult = ((
      ...args: DynamicSelectorArgsWithState | DynamicSelectorArgsWithoutState
    ): ReturnType | undefined => {
      const result = evaluateSelectorReadOnly(args);

      if (result[RESULT_ENTRY__HAS_RETURN_VALUE]) {
        return result[RESULT_ENTRY__RETURN_VALUE];
      }
      return;
    }) as DynamicSelectorFn<ReturnType | undefined>;

    outerFn.hasCachedResult = ((
      ...args: DynamicSelectorArgsWithState | DynamicSelectorArgsWithoutState
    ): boolean => {
      const result = evaluateSelectorReadOnly(args);
      return result[RESULT_ENTRY__HAS_RETURN_VALUE];
    }) as DynamicSelectorFn<boolean>;

    /**
     * DO NOT USE THIS.
     * This is only for debugging purposes
     */
    outerFn._resultCache = resultCache;

    outerFn.isDynamicSelector = true;

    outerFn.displayName = displayName || innerFn.displayName || innerFn.name;

    return outerFn;
  };

  return createDynamicSelector;
};

export { dynamicSelectorForState };
