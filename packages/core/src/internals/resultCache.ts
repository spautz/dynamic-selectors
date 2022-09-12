import { getTopCallStackEntry } from './callStack';
import type { DynamicSelectorDebugInfo } from './debugInfo';
import { createDebugInfo } from './debugInfo';
import type {
  DynamicSelectorCallDependencies,
  DynamicSelectorStateDependencies,
} from './dependencies';
import type { DynamicSelectorStateOptions } from '../types';

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
  unknown,
  /* allow execution? */
  boolean,
  /* record dependencies? */
  boolean,
  /* stateDependencies/lastStateDependencies */
  DynamicSelectorStateDependencies,
  /* callDependencies/lastCallDependencies */
  DynamicSelectorCallDependencies,
  /* hasReturnValue/hasLastReturnValue */
  boolean,
  /* returnValue/lastReturnValue */
  unknown,
  /* error/lastError thrown by innerFn */
  Error | null,
  /* debugInfo */
  DynamicSelectorDebugInfo,
];

// These keys just make the ResultEntry code easier to read
export const RESULT_ENTRY__STATE_OPTIONS = 0 as const;
export const RESULT_ENTRY__STATE = 1 as const;
export const RESULT_ENTRY__ALLOW_EXECUTION = 2 as const;
export const RESULT_ENTRY__RECORD_DEPENDENCIES = 3 as const;
export const RESULT_ENTRY__STATE_DEPENDENCIES = 4 as const;
export const RESULT_ENTRY__CALL_DEPENDENCIES = 5 as const;
export const RESULT_ENTRY__HAS_RETURN_VALUE = 6 as const;
export const RESULT_ENTRY__RETURN_VALUE = 7 as const;
export const RESULT_ENTRY__ERROR = 8 as const;
export const RESULT_ENTRY__DEBUG_INFO = 9 as const;

export type DynamicSelectorResultCache = {
  get: (paramKey: string) => DynamicSelectorResultEntry | undefined;
  set: (paramKey: string, newEntry: DynamicSelectorResultEntry) => void;
  [propName: string]: unknown;
};

const createResultEntry = (
  stateOptions: DynamicSelectorStateOptions,
  state: unknown,
  allowExecution: boolean,
  recordDependencies: boolean,
  myPreviousResult?: DynamicSelectorResultEntry,
): DynamicSelectorResultEntry => {
  const newResultEntry: DynamicSelectorResultEntry = [
    stateOptions,
    state,
    allowExecution,
    recordDependencies,
    [],
    [],
    false,
    undefined,
    null,
    null,
  ];

  /* c8 ignore start */
  if (process.env.NODE_ENV !== 'production') {
    newResultEntry[RESULT_ENTRY__DEBUG_INFO] = myPreviousResult
      ? myPreviousResult[RESULT_ENTRY__DEBUG_INFO]
      : createDebugInfo();
  }
  /* c8 ignore stop */
  return newResultEntry;
};

// Temporary mask over the top of the stack, to prevent dependencies from re-running when we're doing a read-only check
const createDepCheckEntry = (allowExecution: boolean): DynamicSelectorResultEntry => {
  const newResultEntry: DynamicSelectorResultEntry = [...getTopCallStackEntry()];
  newResultEntry[RESULT_ENTRY__ALLOW_EXECUTION] = allowExecution;
  newResultEntry[RESULT_ENTRY__RECORD_DEPENDENCIES] = false;
  /* c8 ignore start */
  if (process.env.NODE_ENV !== 'production') {
    newResultEntry[RESULT_ENTRY__DEBUG_INFO] = null;
  }
  /* c8 ignore stop */
  return newResultEntry;
};

export { createResultEntry, createDepCheckEntry };
