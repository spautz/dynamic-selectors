import type { DynamicSelectorDebugInfo, DynamicSelectorResultCache } from './internals';
import { DynamicSelectorResultEntry } from './internals';

type AnyPrimitive = boolean | number | string | null | undefined;

/**
 * If we can't infer it, and we aren't given a type, the selector will assume `any` state is valid.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DefaultStateType = any;

/**
 * If we can't infer it, and we aren't given a type, the selector will return an `unknown` type by default.
 */
export type DefaultReturnType = unknown;

/**
 * If we can't infer it, and we aren't given a type, the selector will allow a single untracked arg by default.
 */
export type DefaultExtraArgsType = [DefaultParamsType];

/**
 * Params may be a primitive or a simple set of primitives: a flat object or a simple array. Complex types and
 * deeply-nested objects should not be used as selector params -- just like they shouldn't be used as route params.
 */
export type DefaultParamsType =
  | AnyPrimitive
  | Array<AnyPrimitive>
  | Record<string, AnyPrimitive | Array<AnyPrimitive>>;

export type DynamicSelectorStateGetFn<
  ReturnType = DefaultReturnType,
  StateType = DefaultStateType,
> = (
  state: StateType,
  // @TODO: Restrict path and infer ReturnType based on deep lookup into StateType
  path: number | string | Array<number | string> | null,
  defaultValue?: ReturnType,
) => ReturnType;

/**
 * Options for how to interact with the state.
 *
 * State options represent an original source of state -- like Redux, a Context value, or some other 'universe'
 * that we want to transform via a selector.
 */
export type DynamicSelectorStateOptions<StateType = DefaultStateType> = {
  /* State equality checking: if this returns true then the states will be considered the same */
  compareState: (oldState: StateType, newState: StateType) => boolean;
  /* Accessor to retrieve a value from the state */
  get: DynamicSelectorStateGetFn<DefaultReturnType, StateType>;
  /* The base options that will be assigned to each selector (unless overridden when creating the selector) */
  defaultSelectorOptions: DynamicSelectorOptions<DefaultReturnType, StateType>;
};

/**
 * Options for how an individual selector behaves.
 */
export type DynamicSelectorOptions<
  ReturnType = DefaultReturnType,
  StateType = DefaultStateType,
  ParamsType = DefaultParamsType,
  ExtraArgsType extends Array<any> = DefaultExtraArgsType,
> = {
  /* Output equality checking: if this returns true then the selector will be considered unchanged */
  compareResult: (oldReturnValue: ReturnType, newReturnValue: ReturnType) => boolean;
  /* Used to customize the cache of results */
  createResultCache: () => DynamicSelectorResultCache;
  /* Verbose output, useful for debugging the library itself */
  debug?: boolean | string;
  /* Sets the function's displayName */
  displayName?: string;
  /* Generates a unique ID for the selector's params */
  getKeyForParams: (params?: ParamsType) => string;
  /* Called if the selector function throws an exception */
  onError:
    | ((
        error: Error,
        args: [StateType, ParamsType, ...ExtraArgsType],
        selectorFn: DynamicSelectorFn<ReturnType, StateType, ParamsType, ExtraArgsType>,
      ) => void)
    | null;
};

/**
 * The `getState` function that's available within each Dynamic Selector.
 */
export type DynamicSelectorStateAccessor<ReturnType, StateType> = (
  // @TODO: Restrict path and infer ReturnType based on deep lookup into StateType
  path: number | string | Array<number | string> | null,
  defaultValue?: ReturnType,
) => ReturnType;

/**
 * The plain, 'inner' function that a Dynamic Selector is created from.
 */
export type DynamicSelectorInnerFn<
  ReturnType,
  StateType,
  ParamsType,
  ExtraArgsType extends Array<any>,
> = ((
  getStateFn: DynamicSelectorStateAccessor<unknown, StateType>,
  params: ParamsType,
  ...extraArgs: ExtraArgsType
) => ReturnType) & {
  displayName?: string;
};

export type DynamicSelectorArgsWithState<
  StateType,
  ParamsType,
  ExtraArgsType extends Array<any>,
> = [StateType, ParamsType, ...ExtraArgsType];

export type DynamicSelectorArgsWithoutState<ParamsType, ExtraArgsType extends Array<any>> = [
  ParamsType,
  ...ExtraArgsType,
];

/**
 * Call signature for a dynamic selector when called from outside any selector:
 * `state` is required.
 */
export type DynamicSelectorFnWithState<
  ReturnType,
  StateType,
  ParamsType,
  ExtraArgsType extends Array<any>,
> = (...args: DynamicSelectorArgsWithState<StateType, ParamsType, ExtraArgsType>) => ReturnType;

/**
 * Call signature for a dynamic selector when called from within another dynamic selector:
 * `state` is not present.
 */
export type DynamicSelectorFnWithoutState<
  ReturnType,
  ParamsType,
  ExtraArgsType extends Array<any>,
> = (...args: DynamicSelectorArgsWithoutState<ParamsType, ExtraArgsType>) => ReturnType;

/**
 * The Dynamic Selector function returned by this library.
 */
export type DynamicSelectorFn<
  ReturnType = DefaultReturnType,
  StateType = DefaultStateType,
  ParamsType = DefaultParamsType,
  ExtraArgsType extends Array<any> = DefaultExtraArgsType,
> = ((
  ...args:
    | DynamicSelectorArgsWithState<StateType, ParamsType, ExtraArgsType>
    | DynamicSelectorArgsWithoutState<ParamsType, ExtraArgsType>
) => ReturnType) & {
  _fn: DynamicSelectorInnerFn<ReturnType, StateType, ParamsType, ExtraArgsType>;
  _dc: DynamicSelectorFnWithState<DynamicSelectorResultEntry, StateType, ParamsType, ExtraArgsType>;
  _rc: DynamicSelectorResultCache;
  displayName: string;
  getDebugInfo: (params?: ParamsType) => DynamicSelectorDebugInfo;
  // getCachedResult and hasCachedResult don't care about or make use of extraArgs
  getCachedResult: DynamicSelectorFn<ReturnType | undefined, StateType, ParamsType, any>;
  hasCachedResult: DynamicSelectorFn<boolean, StateType, ParamsType, any>;
  isDynamicSelector: true;
  resetCache: () => void;
};
