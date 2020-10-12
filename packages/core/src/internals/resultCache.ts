import { createDebugInfo, DynamicSelectorDebugInfo } from './debugInfo';
import { DynamicSelectorCallDependencies, DynamicSelectorStateDependencies } from './dependencies';
import { DynamicSelectorStateOptions } from '../types';

/**
 * This is where things happen: this tracks everything about a single Dynamic Selector call: what was called,
 * what arguments and params were used, what state and call dependenies it accessed, and what the result was.
 *
 * Depending on whether it's active (in the CallStack) or finished (in the resultCache) these values will either
 * represent the current state or the previous state from when it ran. Only debugInfo persists forever.
 */
export type DynamicSelectorResultEntry = [
  /* stateOptions (used to indicate the 'universe' this selector lives in) */
  DynamicSelectorStateOptions,
  /* state/lastState */
  any,
  /* stateDependencies/lastStateDependencies */
  DynamicSelectorStateDependencies,
  /* callDependencies/lastCallDependencies */
  DynamicSelectorCallDependencies,
  /* hasReturnValue/hasLastReturnValue */
  boolean,
  /* returnValue/lastReturnValue */
  any,
  /* error/lastError thrown by innerFn */
  Error | null,
  /* debugInfo */
  DynamicSelectorDebugInfo,
];

// These keys just make the ResultEntry code easier to read
export const RESULT_ENTRY__STATE_OPTIONS = 0 as const;
export const RESULT_ENTRY__STATE = 1 as const;
export const RESULT_ENTRY__STATE_DEPENDENCIES = 2 as const;
export const RESULT_ENTRY__CALL_DEPENDENCIES = 3 as const;
export const RESULT_ENTRY__HAS_RETURN_VALUE = 4 as const;
export const RESULT_ENTRY__RETURN_VALUE = 5 as const;
export const RESULT_ENTRY__ERROR = 6 as const;
export const RESULT_ENTRY__DEBUG_INFO = 7 as const;

export type DynamicSelectorResultCache = {
  has: (paramKey: string) => boolean;
  get: (paramKey: string) => DynamicSelectorResultEntry | undefined;
  set: (paramKey: string, newEntry: DynamicSelectorResultEntry) => void;
  reset: () => void;
};

const createResultEntry = (
  stateOptions: DynamicSelectorStateOptions,
  state: any,
  previousResult?: DynamicSelectorResultEntry,
): DynamicSelectorResultEntry => {
  const newResultEntry: DynamicSelectorResultEntry = [
    stateOptions,
    state,
    [],
    [],
    false,
    undefined,
    null,
    null,
  ];

  if (process.env.NODE_ENV !== 'production') {
    newResultEntry[RESULT_ENTRY__DEBUG_INFO] = previousResult
      ? previousResult[RESULT_ENTRY__DEBUG_INFO]
      : createDebugInfo();
  }
  return newResultEntry;
};

export { createResultEntry };
