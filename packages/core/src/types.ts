import type {
  DynamicSelectorDebugInfo,
  DynamicSelectorResultCache,
  DynamicSelectorResultEntry,
} from './internals';

type AnyPrimitive = boolean | number | string | null | undefined;

/**
 * This type alias is for readability only.
 */
export type DefaultReturnType = unknown;

/**
 * This type alias is for readability only.
 * Any state shape is valid, and we can't make assumptions about it.
 */
export type DefaultStateType = unknown;

/**
 * This type alias is for readability only.
 * Each selector allows any number of additional arguments after the params.
 */
export type InternalExtraArgsType = Array<unknown>;

/**
 * Params may be a primitive or a simple set of primitives: a flat object or a simple array. Complex types and
 * deeply-nested objects should not be used as selector params -- just like they shouldn't be used as route params.
 */
export type DynamicSelectorParams =
  | AnyPrimitive
  | Array<AnyPrimitive>
  | Record<string, AnyPrimitive | Array<AnyPrimitive>>;

export type DynamicSelectorStateGetFn<StateType = DefaultStateType> = (
  state: StateType,
  path: number | string | Array<number | string> | null,
  defaultValue?: unknown,
) => unknown;

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
  get: DynamicSelectorStateGetFn<StateType>;
  /* The base options that will be assigned to each selector (unless overridden when creating the selector) */
  defaultSelectorOptions: DynamicSelectorOptions;
};

/**
 * Options for how an individual selector behaves.
 */
export type DynamicSelectorOptions<ReturnType = DefaultReturnType> = {
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
        args: [DefaultStateType, DynamicSelectorParams, ...InternalExtraArgsType],
        selectorFn: DynamicSelectorFn<unknown, (...args: Array<unknown>) => unknown>,
      ) => void)
    | null;
};

/**
 * The `getState` function that's available within each Dynamic Selector.
 */
export type DynamicSelectorStateAccessor<ReturnType = DefaultReturnType> = <ReturnType>(
  path: number | string | Array<number | string> | null,
  defaultValue?: ReturnType,
) => ReturnType | (ReturnType extends undefined ? undefined : never);

/**
 * The plain, 'inner' function that a Dynamic Selector is created from.
 */
export type DynamicSelectorInnerFn<ReturnType> = ((
  getStateFn: DynamicSelectorStateAccessor<ReturnType>,
  params?: DynamicSelectorParams,
  ...extraArgs: InternalExtraArgsType
) => ReturnType) & {
  displayName?: string;
};

// const doSomething = <ReturnType extends number, Arg0 extends any, Arg1 extends string>(
//   testFn: (arg0: Arg0, arg1: Arg1) => ReturnType,
// ): (() => number) => {
//   return 3 as any;
// };
//
// type DoSomethingType = <ReturnType extends number, Arg0 extends any, Arg1 extends string>(
//   testFn: (arg0: Arg0, arg1: Arg1) => ReturnType,
// ) => () => number;
//
// const doSomething2: DoSomethingType = <
//   ReturnType extends number,
//   Arg0 extends any,
//   Arg1 extends string,
// >(
//   testFn: (arg0: Arg0, arg1: Arg1) => ReturnType,
// ): (() => number) => {
//   return 3 as any;
// };
//
// export const foo = doSomething2((_state: Record<string, number>, _path: string) => {
//   return 3;
// });
//
// export const bar: number = foo;
// export const bar2: string = foo;
//
// export type DynamicSelectorFnCallWithState = (state: StateType) => ReturnType;

export type DynamicSelectorArgsWithState<StateType> = [
  StateType,
  DynamicSelectorParams?,
  ...InternalExtraArgsType,
];

export type DynamicSelectorArgsWithoutState = [DynamicSelectorParams?, ...InternalExtraArgsType];

export type DynamicSelectorArgsWithOrWithoutState<StateType> =
  | DynamicSelectorArgsWithState<StateType>
  | DynamicSelectorArgsWithoutState;

/**
 * The Dynamic Selector function returned by this library.
 */
// export type DynamicSelectorFn<ReturnType = DefaultReturnType, StateType = DefaultStateType> = ((
//   ...args: DynamicSelectorArgsWithOrWithoutState<StateType>
// ) => ReturnType) & {
//   _fn: DynamicSelectorInnerFn<ReturnType>;
//   _dc: (...args: DynamicSelectorArgsWithState<StateType>) => DynamicSelectorResultEntry;
//   _rc: DynamicSelectorResultCache;
//   displayName: string;
//   getDebugInfo: (params?: DynamicSelectorParams) => DynamicSelectorDebugInfo;
//   // getCachedResult and hasCachedResult don't care about or make use of extraArgs
//   getCachedResult: DynamicSelectorFn<ReturnType | undefined, StateType>;
//   hasCachedResult: DynamicSelectorFn<boolean, StateType>;
//   isDynamicSelector: true;
//   resetCache: () => void;
// };

export type DynamicSelectorFn_Old<StateType, InnerFn extends DynamicSelectorInnerFn<any>> = (
  | ReplaceFirstArg<InnerFn, StateType>
  | RemoveFirstArg<InnerFn>
) & {
  _fn: InnerFn;
  _dc: ReplaceFirstArg<InnerFn, StateType>;
  _rc: DynamicSelectorResultCache;
  displayName: string;
  getDebugInfo: (params?: DynamicSelectorParams) => DynamicSelectorDebugInfo;
  getCachedResult: ReplaceReturnType<InnerFn, ReturnType<InnerFn> | undefined>;
  hasCachedResult: ReplaceReturnType<InnerFn, boolean>;
  isDynamicSelector: true;
  resetCache: () => void;
};

/**
 * Main typing for a dynamic-selector function, autogenerated from the typings of its internal function.
 */
export interface DynamicSelectorFn<StateType, InnerFn extends DynamicSelectorInnerFn<any>> {
  /** Call signature when invoked from inside another selector: no state argument */
  (...args: RemoveFirstElement<Parameters<InnerFn>>): ReturnType<InnerFn>;
  /** Call signature when invoked from outside any selector: state is first argument */
  (state: StateType, ...args: RemoveFirstElement<Parameters<InnerFn>>): ReturnType<InnerFn>;

  _fn: InnerFn;
  _dc: ReplaceFirstArg<InnerFn, StateType>;
  _rc: DynamicSelectorResultCache;
  displayName: string;
  getDebugInfo: (params?: DynamicSelectorParams) => DynamicSelectorDebugInfo;
  getCachedResult: ReplaceReturnType<InnerFn, ReturnType<InnerFn> | undefined>;
  hasCachedResult: ReplaceReturnType<InnerFn, boolean>;
  isDynamicSelector: true;
  resetCache: () => void;
}

/**
 * Backup typing for a dynamic-selector function, generated manually from specific types.
 */
export interface DynamicSelectorFnFromTypes<
  ReturnType,
  StateType,
  ParamsType,
  ExtraArgsType extends Array<any> = InternalExtraArgsType,
> {
  /** Call signature when invoked from inside another selector: no state argument */
  (params: ParamsType, ...extraArgs: ExtraArgsType): ReturnType;
  /** Call signature when invoked from outside any selector: state is first argument */
  (state: StateType, params: ParamsType, ...extraArgs: ExtraArgsType): ReturnType;

  _fn: DynamicSelectorInnerFn<ReturnType>;
  _dc: (
    state: StateType,
    params: ParamsType,
    ...extraArgs: ExtraArgsType
  ) => DynamicSelectorResultEntry;
  _rc: DynamicSelectorResultCache;
  displayName: string;
  getDebugInfo: (params: ParamsType) => DynamicSelectorDebugInfo;
  // getCachedResult and hasCachedResult don't care about or make use of extraArgs
  getCachedResult: DynamicSelectorFnFromTypes<
    ReturnType | undefined,
    StateType,
    ParamsType,
    ExtraArgsType | Array<undefined>
  >;
  hasCachedResult: DynamicSelectorFnFromTypes<
    boolean,
    StateType,
    ParamsType,
    ExtraArgsType | Array<undefined>
  >;
  isDynamicSelector: true;
  resetCache: () => void;
}

type RemoveFirstElement<List extends Array<unknown>> = List extends [
  infer FirstType,
  ...infer AllTypesAfterFirst,
]
  ? AllTypesAfterFirst
  : [];

export type RemoveFirstArg<FnType extends (firstArg: any, ...otherArgs: any) => any> = (
  ...args: RemoveFirstElement<Parameters<FnType>>
) => ReturnType<FnType>;

export type ReplaceFirstArg<
  FnType extends (firstArg: any, ...otherArgs: any) => any,
  NewFirstArgType,
> = (
  firstArg: NewFirstArgType,
  ...args: RemoveFirstElement<Parameters<FnType>>
) => ReturnType<FnType>;

export type ReplaceReturnType<FnType extends (...args: any) => any, NewReturnType> = (
  ...args: Parameters<FnType>
) => NewReturnType;

/////

interface WithOrWithoutState<FnType extends (firstArg: any, ...otherArgs: any) => any, StateType> {
  (...args: RemoveFirstElement<Parameters<FnType>>): ReturnType<FnType>;
  (state: StateType, ...args: RemoveFirstElement<Parameters<FnType>>): ReturnType<FnType>;
}

const plainFn = (getState: (path: string) => number) => {
  return getState('a');
};
type FnWithNoArgs = WithOrWithoutState<typeof plainFn, Record<string, number>>;
export const asdf: FnWithNoArgs = () => 3;
asdf();
asdf(3);
asdf({ foo: 3 });
asdf({ foo: '3' });
