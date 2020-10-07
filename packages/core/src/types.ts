import { DynamicSelectorResultCache } from './internals';

type AnyPrimitive = boolean | number | string | null | undefined;

/**
 * Options for how to interact with the state.
 *
 * State options represent an original source of state -- like Redux, a Context value, or some other 'universe'
 * that delivers a value we need to filter or transform.
 */
export type DynamicSelectorStateOptions<StateType = any> = {
  compareState: (oldState: StateType, newState: StateType) => boolean;
  get: (state: StateType, path: string | Array<string>, defaultValue: any) => any;
  defaultSelectorOptions: DynamicSelectorOptions;
};

/**
 * Options for how an individual selector behaves.
 */
export type DynamicSelectorOptions<ReturnType = any, StateType = any> = {
  compareResult: (oldReturnValue: ReturnType, newReturnValue: ReturnType) => boolean;
  getKeyForParams: (params: DynamicSelectorParams) => string;
  onException:
    | ((error: Error, args: [StateType, DynamicSelectorParams, ...Array<any>]) => void)
    | null;
  createResultCache: () => DynamicSelectorResultCache;
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
  path: string | Array<string>,
  defaultValue?: ReturnType,
) => ReturnType;

/**
 * The 'inner' or 'seed' function that a Dynamic Selector is created from.
 */
export type DynamicSelectorInnerFn<ReturnType = any> = (
  stateAccessor: DynamicSelectorStateAccessor,
  params: DynamicSelectorParams,
  ...extraArgs: Array<any>
) => ReturnType;

/**
 * The Dynamic Selector function returned by this library.
 */
export type DynamicSelectorFn<ReturnType = any> = (
  state: any,
  params?: DynamicSelectorParams,
  ...extraArgs: Array<any>
) => ReturnType;
