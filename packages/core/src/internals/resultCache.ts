import { DynamicSelectorDependencyEntry } from './callStack';
import { createDebugInfo, DynamicSelectorDebugInfo } from './debugInfo';

export type DynamicSelectorResultEntry = [
  /* lastState */
  any,
  /* lastDependencies */
  Array<DynamicSelectorDependencyEntry>,
  /* hasLastReturnValue */
  boolean,
  /* lastReturnValue */
  any,
  /* lastError thrown by innerFn */
  Error | null,
  /* debugInfo */
  DynamicSelectorDebugInfo,
];

// These keys just make the ResultEntry code easier to read
export const RESULT_ENTRY__STATE = 0;
export const RESULT_ENTRY__DEPENDENCIES = 1;
export const RESULT_ENTRY__HAS_RETURN_VALUE = 2;
export const RESULT_ENTRY__RETURN_VALUE = 3;
export const RESULT_ENTRY__ERROR = 4;
export const RESULT_ENTRY__DEBUG_INFO = 5;

export type DynamicSelectorResultCache = {
  has: (paramKey: string) => boolean;
  get: (paramKey: string) => DynamicSelectorResultEntry | undefined;
  set: (paramKey: string, newEntry: DynamicSelectorResultEntry) => void;
  reset: () => void;
};

const createResultEntry = (
  state: any,
  previousResult?: DynamicSelectorResultEntry,
): DynamicSelectorResultEntry => {
  const newResultEntry: DynamicSelectorResultEntry = [state, [], false, undefined, null, null];

  if (process.env.NODE_ENV !== 'production') {
    newResultEntry[RESULT_ENTRY__DEBUG_INFO] = previousResult
      ? previousResult[RESULT_ENTRY__DEBUG_INFO]
      : createDebugInfo();
  }
  return newResultEntry;
};

export { createResultEntry };
