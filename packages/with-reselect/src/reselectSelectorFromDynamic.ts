import type { DynamicSelectorArgsWithoutState, DynamicSelectorFn } from '@dynamic-selectors/core';
import type { Selector } from 'reselect';

const reselectSelectorFromDynamic = <StateType = unknown, ReturnType = unknown>(
  dynamicSelectorFn: DynamicSelectorFn<ReturnType>,
  ...paramsAndOtherArgs: DynamicSelectorArgsWithoutState
): Selector<StateType, ReturnType> => {
  return (state) => dynamicSelectorFn(state, ...paramsAndOtherArgs);
};

export { reselectSelectorFromDynamic };
