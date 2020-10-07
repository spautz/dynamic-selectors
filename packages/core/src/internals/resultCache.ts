import { DynamicSelectorDependencyEntry } from './callStack';
import { DynamicSelectorDebugInfo } from './debugInfo';

export type DynamicSelectorResultEntry = [
  /* lastState */
  any,
  /* dependencies */
  Array<DynamicSelectorDependencyEntry>,
  /* hasLastReturnValue */
  boolean,
  /* lastReturnValue */
  any,
  /* debugInfo */
  DynamicSelectorDebugInfo,
];

// These keys just make the ResultEntry code easier to read
export const RESULT_ENTRY__STATE = 0;
export const RESULT_ENTRY__DEPENDENCIES = 1;
export const RESULT_ENTRY__HAS_RETURN_VALUE = 2;
export const RESULT_ENTRY__RETURN_VALUE = 3;
export const RESULT_ENTRY__DEBUG_INFO = 4;

export type DynamicSelectorResultCache = {
  has: (paramKey: string) => boolean;
  get: (paramKey: string) => DynamicSelectorResultEntry | undefined;
  set: (paramKey: string, newEntry: DynamicSelectorResultEntry) => void;
  reset: () => void;
};
