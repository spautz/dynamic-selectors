import { DynamicSelectorFn, DynamicSelectorParams, DynamicSelectorStateGetFn } from '../types';
import {
  DynamicSelectorResultEntry,
  RESULT_ENTRY__HAS_RETURN_VALUE,
  RESULT_ENTRY__RETURN_VALUE,
} from './resultCache';
import { popCallStackEntry, pushCallStackEntry } from './callStack';

/**
 * We track wo types of dependencies:
 *  - "State Dependency": the selector accessed a state value directly, through getState
 *  - "Call Dependency": the selector called another selector, maybe passing it some params
 */

export type DynamicSelectorStateDependencies = Record<string, any>;
export type DynamicSelectorCallDependencies = Array<DynamicSelectorCallDependency>;

export type DynamicSelectorCallDependency = [
  /* selectorFn  */
  DynamicSelectorFn,
  /* params */
  DynamicSelectorParams,
  /* returnValue */
  any,
];

// These keys just make the CallDependency code easier to read
export const CALL_DEPENDENCY__SELECTOR_FN = 0 as const;
export const CALL_DEPENDENCY__PARAMS = 1 as const;
export const CALL_DEPENDENCY__RETURN_VALUE = 2 as const;

const createCallDependency = (
  selectorFn: DynamicSelectorFn,
  params: DynamicSelectorParams,
  returnValue: any,
): DynamicSelectorCallDependency => [selectorFn, params, returnValue];

const hasAnyStateDependencyChanged = (
  getFn: DynamicSelectorStateGetFn,
  state: any,
  previousStateDependencies: DynamicSelectorStateDependencies,
): boolean => {
  // Manual loop to get the tiny performance boost, and because we don't need a closure
  for (let path in previousStateDependencies) {
    if (previousStateDependencies.hasOwnProperty(path)) {
      const previousValue = previousStateDependencies[path];
      const currentValue = path ? getFn(state, path) : state;
      if (previousValue !== currentValue) {
        // The state we care about has changed.
        // (We use strict equality -- not compareState -- because compareState was already used to decide whether to
        //  run the dependency checks)
        return true;
      }
    }
  }
  return false;
};

const hasAnyCallDependencyChanged = (
  state: any,
  previousCallDependencies: DynamicSelectorCallDependencies,
  allowExecution: boolean,
  otherArgs: Array<any>,
): boolean => {
  // Manual loop to get the tiny performance boost, and because we don't need a closure
  const numPreviousCallDependencies = previousCallDependencies.length;
  if (numPreviousCallDependencies) {
    // We're just checking dependencies, not re-registering them, so put a dummy entry on the call stack.
    pushCallStackEntry(allowExecution);

    for (let i = 0; i < numPreviousCallDependencies; i += 1) {
      const [
        dependencySelectorFn,
        dependencyParams,
        dependencyReturnValue,
      ] = previousCallDependencies[i];

      if (false) {
        // This block is here ONLY to catch possible errors if the structure of `previousCallDependencies` changes
        const checkType_selectorFn: DynamicSelectorCallDependency[typeof CALL_DEPENDENCY__SELECTOR_FN] = dependencySelectorFn;
        const checkType_params: DynamicSelectorCallDependency[typeof CALL_DEPENDENCY__PARAMS] = dependencyParams;
        const checkType_dependencyReturnValue: DynamicSelectorCallDependency[typeof CALL_DEPENDENCY__RETURN_VALUE] = dependencyReturnValue;
        console.log({ checkType_selectorFn, checkType_params, checkType_dependencyReturnValue });
      }

      // Does our dependency have anything new? Let's run it to find out.
      const result = dependencySelectorFn._callDirect(state, dependencyParams, ...otherArgs);
      const [, , , , hasReturnValue, newReturnValue] = result;

      if (false) {
        // This block is here ONLY to catch possible errors if the structure of `result` changes
        const checkType_hasReturnValue: DynamicSelectorResultEntry[typeof RESULT_ENTRY__HAS_RETURN_VALUE] = hasReturnValue;
        const checkType_newReturnValue: DynamicSelectorResultEntry[typeof RESULT_ENTRY__RETURN_VALUE] = newReturnValue;
        console.log({ checkType_hasReturnValue, checkType_newReturnValue });
      }

      if (hasReturnValue && newReturnValue !== dependencyReturnValue) {
        // Something returned a new value: that's a real change.
        // (We use strict equality -- not compareResult -- because compareResult was already used to decide whether to
        //  return the exact prior value)
        popCallStackEntry();
        return true;
      }
    }

    popCallStackEntry();
  }
  return false;
};

export { createCallDependency, hasAnyCallDependencyChanged, hasAnyStateDependencyChanged };
