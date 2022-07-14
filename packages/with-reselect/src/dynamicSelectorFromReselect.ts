import {
  createDynamicSelector,
  DynamicSelectorFn,
  DynamicSelectorInnerFn,
} from '@dynamic-selectors/core';
import { Selector } from 'reselect';

/**
 * Wraps a Reselect selector in a new function, which can be passed to createDynamicSelector()
 */
const wrapReselect = <StateType = unknown, ReturnType = unknown>(
  reselectSelectorFn: Selector<StateType, ReturnType>,
): DynamicSelectorInnerFn<ReturnType> => {
  const innerFn: DynamicSelectorInnerFn = (getState) => {
    return reselectSelectorFn(getState(null));
  };

  innerFn.displayName = reselectSelectorFn.name;
  return innerFn;
};

/**
 * For convenience, a helper that wraps the Reselect selector and passes it to createDynamicSelector, in a single step.
 *
 * If you make your own selector creator (via `dynamicSelectorForState`), you would create a similar "create..."
 * function around it.
 */
const dynamicSelectorFromReselect = <StateType = unknown, ReturnType = unknown>(
  reselectSelectorFn: Selector<StateType, ReturnType>,
  dynamicSelectorOptions?: Parameters<typeof createDynamicSelector>[1],
): DynamicSelectorFn<ReturnType> => {
  return createDynamicSelector(wrapReselect(reselectSelectorFn), dynamicSelectorOptions);
};

export { wrapReselect, dynamicSelectorFromReselect };
