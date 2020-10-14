import { DynamicSelectorDebugInfo, DynamicSelectorResultCache } from './internals';

type AnyPrimitive = boolean | number | string | null | undefined;

export type DynamicSelectorStateGetFn<StateType = any, ReturnType = any> = (
  state: StateType,
  path: string | null,
  defaultValue?: ReturnType,
) => ReturnType;

/**
 * Options for how to interact with the state.
 *
 * State options represent an original source of state -- like Redux, a Context value, or some other 'universe'
 * that delivers a value we need to filter or transform.
 */
export type DynamicSelectorStateOptions<StateType = any> = {
  /* State equality checking: if this returns true then the states will be considered the same */
  compareState: (oldState: StateType, newState: StateType) => boolean;
  /* Accessor to retrieve a value from the state */
  get: DynamicSelectorStateGetFn<StateType>;
  /* The base options that will be assigned to each selector (unless overridden when creating the selector) */
  defaultSelectorOptions: DynamicSelectorOptions;
};

/**
 * Options for how an individual selector behaves.
 */
export type DynamicSelectorOptions<ReturnType = any, StateType = any> = {
  /* Output equality checking: if this returns true then the selector will be considered unchanged */
  compareResult: (oldReturnValue: ReturnType, newReturnValue: ReturnType) => boolean;
  /* Used to customize the cache of results */
  createResultCache: () => DynamicSelectorResultCache;
  /* Verbose output, useful for debugging the library itself */
  debug?: boolean | string;
  /* Sets the function's displayName */
  displayName?: string;
  /* Generates a unique ID for the selector's params */
  getKeyForParams: (params?: DynamicSelectorParams) => string;
  /* Called if the selector function throws an exception */
  onError:
    | ((
        error: Error,
        args: [StateType, DynamicSelectorParams | any, ...Array<any>],
        selectorFn: DynamicSelectorFn,
      ) => void)
    | null;
};

/**
 * Params may be a primitive or a simple set of primitives: a flat object or a simple array. Complex types and
 * deeply-nested objects should not be used as selector params -- just like they shouldn't be used as route params.
 */
export type DynamicSelectorParams =
  | AnyPrimitive
  | Array<AnyPrimitive>
  | Record<string, AnyPrimitive | Array<AnyPrimitive>>;

/**
 * The `getState` function that's available within each Dynamic Selector.
 */
export type DynamicSelectorStateAccessor<ReturnType = any> = (
  path: string | null,
  defaultValue?: ReturnType,
) => ReturnType;

/**
 * The 'inner' or 'seed' function that a Dynamic Selector is created from.
 */
export type DynamicSelectorInnerFn<ReturnType = any> = ((
  stateAccessor: DynamicSelectorStateAccessor,
  params?: DynamicSelectorParams | any,
  ...extraArgs: Array<any>
) => ReturnType) & {
  displayName?: string;
};

export type DynamicSelectorArgsWithState<StateType = any> = [
  StateType,
  DynamicSelectorParams?,
  ...Array<any>
];
export type DynamicSelectorArgsWithoutState = [DynamicSelectorParams?, ...Array<any>];

export type DynamicSelectorFnWithState<ReturnType = any> = (
  ...args: DynamicSelectorArgsWithState
) => ReturnType;

export type DynamicSelectorFnWithoutState<ReturnType = any> = (
  ...args: DynamicSelectorArgsWithoutState
) => ReturnType;

/**
 * The Dynamic Selector function returned by this library.
 */
export type DynamicSelectorFn<ReturnType = any> = ((
  ...args: DynamicSelectorArgsWithState | DynamicSelectorArgsWithoutState
) => ReturnType) & {
  _innerFn: DynamicSelectorInnerFn<ReturnType>;
  _dc: DynamicSelectorFnWithState<ReturnType>;
  _resultCache: DynamicSelectorResultCache;
  displayName: string;
  getDebugInfo: (params?: DynamicSelectorParams) => DynamicSelectorDebugInfo;
  getCachedResult: DynamicSelectorFn<ReturnType>;
  hasCachedResult: DynamicSelectorFn<boolean>;
  isDynamicSelector: true;
};
