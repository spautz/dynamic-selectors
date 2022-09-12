import type {
  DynamicSelectorDebugInfo,
  DynamicSelectorResultCache,
  DynamicSelectorResultEntry,
} from './internals';
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
  validateOptions,
  validateStateOptions,
} from './internals';
import type {
  DefaultExtraArgsType,
  DefaultReturnType,
  DefaultStateType,
  DynamicSelectorFnFromTypes,
  DynamicSelectorInnerFn,
  DynamicSelectorOptions,
  DynamicSelectorParams,
  DynamicSelectorStateOptions,
  StatePath,
} from './types';
import { DynamicSelectorFnFromInnerFn, RemoveFirstElement } from './types';

const dynamicSelectorForState = <StateType = DefaultStateType>(
  stateOptions: DynamicSelectorStateOptions<StateType>,
) => {
  // Internally we use the default types to keep things simple
  type ArgsWithState = [StateType, DynamicSelectorParams, []];
  type ArgsWithoutState = [DynamicSelectorParams, []];
  type ArgsWithOrWithoutState = ArgsWithState | ArgsWithoutState;

  validateStateOptions(stateOptions);
  const { compareState, get, defaultSelectorOptions } = stateOptions;

  /**
   * If the selector is called from within another selector, in the same 'universe' (stateOptions), then we need
   * to prepend `state` to its arguments.
   *
   * Most of the 'public' entry points can be called from either a "with state" context or a "without state"
   * context. We use this to avoid doubling the argument-massaging logic in each of them.
   */
  const addStateToArguments = (args: ArgsWithOrWithoutState): ArgsWithState => {
    const parentCaller = getTopCallStackEntry();

    if (parentCaller) {
      if (parentCaller[RESULT_ENTRY__STATE_OPTIONS] !== stateOptions) {
        // @TODO: Better error message/explanation, and add a way to mute it
        console.error(
          'A selector for one state is being called from a selector for a different state: this is probably a bug',
        );
        return args as ArgsWithState;
      }

      const state = parentCaller[RESULT_ENTRY__STATE];
      return [state, ...args] as ArgsWithState;
    }

    // When called from outside (i.e., from mapStateToProps) the state will to be provided.
    return args as ArgsWithState;
  };

  /**
   * Constructor for dynamic selectors, using the state provided
   */
  type CreateDynamicSelectorFnForState = <InnerFn extends DynamicSelectorInnerFn<StateType>>(
    selectorFn: InnerFn,
    options?: Partial<
      DynamicSelectorOptions<
        ReturnType<InnerFn>,
        // Arg0 = state = StateType
        Parameters<InnerFn>[0],
        // Arg1 = params = ParamsType
        Parameters<InnerFn>[1],
        // ...otherArgs = ExtraArgsType
        RemoveFirstElement<RemoveFirstElement<Parameters<InnerFn>>>
      >
    >,
  ) => DynamicSelectorFnFromInnerFn<StateType, InnerFn>;

  const createDynamicSelector: CreateDynamicSelectorFnForState = ((
    innerFn: DynamicSelectorInnerFn<StateType>,
    options,
  ) => {
    const mergedOptions = (
      defaultSelectorOptions && options
        ? { ...defaultSelectorOptions, ...options }
        : options || defaultSelectorOptions
    ) as DynamicSelectorOptions<DefaultReturnType, StateType>;

    validateOptions(mergedOptions);
    const { compareResult, createResultCache, debug, displayName, getKeyForParams, onError } =
      mergedOptions;

    let resultCache: DynamicSelectorResultCache = createResultCache();

    // eslint-disable-next-line prefer-const
    let outerFn: DynamicSelectorFnFromTypes<DefaultReturnType, StateType>;

    ///////////////////////////////////////////////////////////////////////////
    // The main algorithm

    /*
     * This is the core function for the selector: the different entry points all run this.
     */
    const evaluateSelector = (
      state: StateType,
      params: DynamicSelectorParams,
      ...otherArgs: DefaultExtraArgsType
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

      /* c8 ignore start */
      if (process.env.NODE_ENV !== 'production') {
        debugInfo = nextResult[RESULT_ENTRY__DEBUG_INFO];
        if (!debugInfo) {
          throw new Error(
            'Internal consistency error: expected to find debugInfo in the nextResultEntry. Please report this bug.',
          );
        }
        debugInfo._verbose = debug && (typeof debug === 'string' ? debug : displayName);

        if (recordDependencies && allowExecution) {
          debugInvoked(debugInfo);
        } else {
          debugDepCheck(debugInfo);
        }
      }
      /* c8 ignore stop */

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

        /* c8 ignore start */
        // eslint-disable-next-line no-constant-condition
        if (false) {
          // This block is here ONLY to catch possible errors if the structure of `previousResult` changes
          const checkType_previousState: DynamicSelectorResultEntry[typeof RESULT_ENTRY__STATE] =
            previousState;
          const checkType_previousStateDependencies: DynamicSelectorResultEntry[typeof RESULT_ENTRY__STATE_DEPENDENCIES] =
            previousStateDependencies;
          const checkType_previousCallDependencies: DynamicSelectorResultEntry[typeof RESULT_ENTRY__CALL_DEPENDENCIES] =
            previousCallDependencies;
          const checkType_hasPreviousReturnValue: DynamicSelectorResultEntry[typeof RESULT_ENTRY__HAS_RETURN_VALUE] =
            hasPreviousReturnValue;
          console.log({
            checkType_previousState,
            checkType_previousStateDependencies,
            checkType_previousCallDependencies,
            checkType_hasPreviousReturnValue,
          });
        }
        /* c8 ignore stop */

        if (hasPreviousReturnValue) {
          if (compareState && compareState(previousState as StateType, state)) {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getState = (path: StatePath, defaultValue: unknown): any => {
          let stateValue;
          if (path) {
            stateValue = get(state, path, defaultValue);
          } else {
            stateValue = state;
          }
          nextResult[RESULT_ENTRY__STATE_DEPENDENCIES][String(path) || ''] = stateValue;
          return stateValue;
        };

        // Any calls to other selectors will register a call dependency on ourselves / our result
        pushCallStackEntry(nextResult);
        try {
          nextResult[RESULT_ENTRY__RETURN_VALUE] = innerFn(getState, params, ...otherArgs);
          nextResult[RESULT_ENTRY__HAS_RETURN_VALUE] = true;
        } catch (e) {
          nextResult[RESULT_ENTRY__ERROR] = e as Error;
          debugAbortedRun(debugInfo);

          if (onError) {
            // If the onError callback returns anything, we'll use that as the return value -- but we still
            // track the error.
            nextResult[RESULT_ENTRY__RETURN_VALUE] = onError(
              e as Error,
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
        if (
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
          if (!nextResult[RESULT_ENTRY__ERROR]) {
            debugPhantomRun(debugInfo);
          }
          // Carry over the *exact* return value we had before
          nextResult[RESULT_ENTRY__RETURN_VALUE] = previousResult[RESULT_ENTRY__RETURN_VALUE];
        } else if (!nextResult[RESULT_ENTRY__ERROR]) {
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
    outerFn = ((...args: ArgsWithOrWithoutState) => {
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

      // It's okay to have *both* an error *and* a return value (although that's rare: it only happens if onError
      // returned a value)
      if (!result[RESULT_ENTRY__HAS_RETURN_VALUE] && result[RESULT_ENTRY__ERROR]) {
        throw result[RESULT_ENTRY__ERROR];
      }
      return result[RESULT_ENTRY__RETURN_VALUE];
    }) as DynamicSelectorFnFromTypes;

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
    outerFn._fn = innerFn;

    outerFn.getDebugInfo = (params: DynamicSelectorParams): DynamicSelectorDebugInfo => {
      /* c8 ignore start */
      if (process.env.NODE_ENV !== 'production') {
        const paramKey = getKeyForParams(params);
        const resultEntry = resultCache.get(paramKey);
        if (resultEntry) {
          return resultEntry[RESULT_ENTRY__DEBUG_INFO];
        }
      }
      /* c8 ignore stop */
      return null;
    };

    // Common code for getCachedResult & hasCachedResult
    const evaluateSelectorReadOnly = (args: ArgsWithOrWithoutState): DynamicSelectorResultEntry => {
      const argsWithState = addStateToArguments(args);
      const rootResult = createResultEntry(stateOptions, argsWithState[0], false, false);

      const paramKey = getKeyForParams(argsWithState[1]);
      if (!resultCache.get(paramKey)) {
        // Don't even bother checking if there's _nothing_ to check
        return rootResult;
      }

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

      if (!result[RESULT_ENTRY__HAS_RETURN_VALUE]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resultCache.set(paramKey, null as any);
      }

      return result;
    };

    /**
     * This is just like the main outerFn, except it prohibits all selectors (this and its dependencies) from
     * re-executing.
     */
    outerFn.getCachedResult = ((...args: ArgsWithOrWithoutState) => {
      const result = evaluateSelectorReadOnly(args);

      if (result[RESULT_ENTRY__HAS_RETURN_VALUE]) {
        return result[RESULT_ENTRY__RETURN_VALUE];
      }
      return;
    }) as () => DefaultReturnType | undefined;

    outerFn.hasCachedResult = ((...args: ArgsWithOrWithoutState): boolean => {
      const result = evaluateSelectorReadOnly(args);
      return result[RESULT_ENTRY__HAS_RETURN_VALUE];
    }) as () => boolean;

    outerFn.resetCache = () => {
      /* c8 ignore start */
      if (process.env.NODE_ENV !== 'production' && getTopCallStackEntry()) {
        // @TODO: Add a way to mute this warning
        console.warn(
          'Called resetCache while selectors are running: this will probably cause unexpected results',
        );
      }
      /* c8 ignore stop */

      outerFn._rc = resultCache = createResultCache();
    };

    /**
     * DO NOT USE THIS.
     * This is only for debugging purposes
     */
    outerFn._rc = resultCache;

    outerFn.isDynamicSelector = true;

    outerFn.displayName = displayName || innerFn.displayName || innerFn.name;

    return outerFn;
  }) as CreateDynamicSelectorFnForState;

  return createDynamicSelector;
};

export { dynamicSelectorForState };
