import { DynamicSelectorFn, DynamicSelectorParams, DynamicSelectorStateOptions } from '../types';

export type DynamicSelectorDependencyEntry = [
  /* selectorFn OR a path in state */
  DynamicSelectorFn | string | Array<string>,
  /* params */
  DynamicSelectorParams,
  /* returnValue */
  any,
];

// These keys just make the DependencyEntry code easier to read
export const DEPENDENCY_ENTRY__SELECTOR_FN = 0;
export const DEPENDENCY_ENTRY__PARAM_STRING = 1;
export const DEPENDENCY_ENTRY__RETURN_VALUE = 2;

const createDependencyEntry = (
  selectorFnOrStatePath: DynamicSelectorFn | string | Array<string>,
  params: DynamicSelectorParams,
  returnValue: any,
): DynamicSelectorDependencyEntry => [selectorFnOrStatePath, params, returnValue];

export type DynamicSelectorCallStackEntry = [
  /* stateOptions (used to indicate the 'universe' this selector lives in) */
  DynamicSelectorStateOptions,
  /* state */
  any,
  /* A place for dependencies to be added */
  Array<DynamicSelectorDependencyEntry>,
];

// These keys just make the CallStackEntry code easier to read
export const CALL_STACK_ENTRY__STATE_OPTIONS = 0;
export const CALL_STACK_ENTRY__STATE = 1;
export const CALL_STACK_ENTRY__DEPENDENCIES = 2;

/**
 * When any Dynamic Selector is run, its info is pushed onto this stack. Then, *other* Dynamic Selectors which get
 * called will be registered as its dependencies. *
 * This single instance is used forever across all selectors.
 */
const callStack: Array<DynamicSelectorCallStackEntry> = [];

const getTopCallStackEntry = () => (callStack.length ? callStack[callStack.length - 1] : null);

const pushCallStackEntry = (
  stateOptions: DynamicSelectorStateOptions,
  currentState: any,
): DynamicSelectorCallStackEntry => {
  const newCallStackEntry: DynamicSelectorCallStackEntry = [stateOptions, currentState, []];

  callStack.push(newCallStackEntry);
  return newCallStackEntry;
};

const popCallStackEntry = callStack.pop.bind(callStack);

export { createDependencyEntry, getTopCallStackEntry, pushCallStackEntry, popCallStackEntry };
