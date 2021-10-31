import { DynamicSelectorDebugInfo, DynamicSelectorResultCache } from './internals';

type AnyPrimitive = boolean | number | string | null | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DefaultStateType = any;
// @TODO for 1.0: `undefined`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DefaultReturnType = any;
// @TODO for 1.0: `AnyPrimitive | Array<AnyPrimitive> | Record<string, AnyPrimitive | Array<AnyPrimitive>>`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DefaultParamsType = any;

export type DynamicSelectorStateGetFn<
  StateType = DefaultStateType,
  ReturnType = DefaultReturnType,
> = (state: StateType, path: string | null, defaultValue?: ReturnType) => ReturnType;

/**
 * Options for how to interact with the state.
 *
 * State options represent an original source of state -- like Redux, a Context value, or some other 'universe'
 * that delivers a value we need to filter or transform.
 */
export type DynamicSelectorStateOptions<StateType = DefaultStateType> = {
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
export type DynamicSelectorOptions<ReturnType = DefaultReturnType, StateType = DefaultStateType> = {
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
        args: [StateType, DynamicSelectorParams | DefaultParamsType, ...Array<unknown>],
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
export type DynamicSelectorStateAccessor<ReturnType = DefaultReturnType> = (
  path: string | null,
  defaultValue?: ReturnType,
) => ReturnType;

/**
 * The 'inner' or 'seed' function that a Dynamic Selector is created from.
 */
export type DynamicSelectorInnerFn<ReturnType = DefaultReturnType> = ((
  stateAccessor: DynamicSelectorStateAccessor,
  params?: DynamicSelectorParams | DefaultParamsType,
  ...extraArgs: Array<unknown>
) => ReturnType) & {
  displayName?: string;
};

export type DynamicSelectorArgsWithState<StateType = DefaultStateType> = [
  StateType,
  DynamicSelectorParams?,
  ...Array<unknown>
];
export type DynamicSelectorArgsWithoutState = [DynamicSelectorParams?, ...Array<unknown>];

export type DynamicSelectorFnWithState<ReturnType = DefaultReturnType> = (
  ...args: DynamicSelectorArgsWithState
) => ReturnType;

export type DynamicSelectorFnWithoutState<ReturnType = DefaultReturnType> = (
  ...args: DynamicSelectorArgsWithoutState
) => ReturnType;

/**
 * The Dynamic Selector function returned by this library.
 */
export type DynamicSelectorFn<ReturnType = DefaultReturnType> = ((
  ...args: DynamicSelectorArgsWithState | DynamicSelectorArgsWithoutState
) => ReturnType) & {
  _fn: DynamicSelectorInnerFn<ReturnType>;
  _dc: DynamicSelectorFnWithState<ReturnType>;
  _rc: DynamicSelectorResultCache;
  displayName: string;
  getDebugInfo: (params?: DynamicSelectorParams) => DynamicSelectorDebugInfo;
  getCachedResult: DynamicSelectorFn<ReturnType>;
  hasCachedResult: DynamicSelectorFn<boolean>;
  isDynamicSelector: true;
  resetCache: () => void;
};
