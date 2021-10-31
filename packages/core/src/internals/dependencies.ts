import { popCallStackEntry, pushCallStackEntry } from './callStack';
import {
  createDepCheckEntry,
  RESULT_ENTRY__HAS_RETURN_VALUE,
  RESULT_ENTRY__RETURN_VALUE,
} from './resultCache';
import {
  DefaultReturnType,
  DefaultStateType,
  DynamicSelectorFn,
  DynamicSelectorParams,
  DynamicSelectorStateGetFn,
} from '../types';

/**
 * We track wo types of dependencies:
 *  - "State Dependency": the selector accessed a state value directly, through getState
 *  - "Call Dependency": the selector called another selector, maybe passing it some params
 */

export type DynamicSelectorStateDependencies = Record<string, unknown>;
export type DynamicSelectorCallDependencies = Array<DynamicSelectorCallDependency>;

export type DynamicSelectorCallDependency = [
  /* selectorFn  */
  DynamicSelectorFn,
  /* params */
  DynamicSelectorParams,
  /* returnValue */
  DefaultReturnType,
  /* isReadOnly */
  boolean,
];

// These keys just make the CallDependency code easier to read
export const CALL_DEPENDENCY__SELECTOR_FN = 0 as const;
export const CALL_DEPENDENCY__PARAMS = 1 as const;
export const CALL_DEPENDENCY__RETURN_VALUE = 2 as const;
export const CALL_DEPENDENCY__IS_READONLY = 3 as const;

const createCallDependency = (
  selectorFn: DynamicSelectorFn,
  params: DynamicSelectorParams,
  returnValue: DefaultReturnType,
  isReadOnly: boolean,
): DynamicSelectorCallDependency => [selectorFn, params, returnValue, isReadOnly];

const hasAnyStateDependencyChanged = (
  getFn: DynamicSelectorStateGetFn,
  state: DefaultStateType,
  previousStateDependencies: DynamicSelectorStateDependencies,
): boolean => {
  // Manual loop to get the tiny performance boost, and because we don't need a closure
  for (const path in previousStateDependencies) {
    if (Object.prototype.hasOwnProperty.call(previousStateDependencies, path)) {
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
  state: DefaultStateType,
  previousCallDependencies: DynamicSelectorCallDependencies,
  allowExecution: boolean,
  otherArgs: Array<unknown>,
): boolean => {
  // Manual loop to get the tiny performance boost, and because we don't need a closure
  const numPreviousCallDependencies = previousCallDependencies.length;
  if (numPreviousCallDependencies) {
    // We're just checking dependencies, not re-registering them, so put a dummy entry on the call stack.
    pushCallStackEntry(createDepCheckEntry(allowExecution));

    for (let i = 0; i < numPreviousCallDependencies; i += 1) {
      const [dependencySelectorFn, dependencyParams, dependencyReturnValue, dependencyIsReadOnly] =
        previousCallDependencies[i];

      /* istanbul ignore next */
      // eslint-disable-next-line no-constant-condition
      if (false) {
        // This block is here ONLY to catch possible errors if the structure of `previousCallDependencies` changes
        const checkType_selectorFn: DynamicSelectorCallDependency[typeof CALL_DEPENDENCY__SELECTOR_FN] =
          dependencySelectorFn;
        const checkType_params: DynamicSelectorCallDependency[typeof CALL_DEPENDENCY__PARAMS] =
          dependencyParams;
        const checkType_dependencyReturnValue: DynamicSelectorCallDependency[typeof CALL_DEPENDENCY__RETURN_VALUE] =
          dependencyReturnValue;
        const checkType_dependencyIsReadOnly: DynamicSelectorCallDependency[typeof CALL_DEPENDENCY__IS_READONLY] =
          dependencyIsReadOnly;
        console.log({
          checkType_selectorFn,
          checkType_params,
          checkType_dependencyReturnValue,
          checkType_dependencyIsReadOnly,
        });
      }

      // Does our dependency have anything new?
      const temporarilyBlockExecution = dependencyIsReadOnly && allowExecution;
      if (temporarilyBlockExecution) {
        // Temporarily add *another* dummy entry to block execution
        pushCallStackEntry(createDepCheckEntry(false));
      }

      // Run it and check the result
      const result = dependencySelectorFn._dc(state, dependencyParams, ...otherArgs);

      if (temporarilyBlockExecution) {
        popCallStackEntry();
      }

      if (
        !result[RESULT_ENTRY__HAS_RETURN_VALUE] ||
        result[RESULT_ENTRY__RETURN_VALUE] !== dependencyReturnValue
      ) {
        // It either failed to return a value, or it returned something new.
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
