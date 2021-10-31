import { DynamicSelectorArgsWithoutState, DynamicSelectorFn } from '@dynamic-selectors/core';
import { Selector } from 'reselect';

const reselectSelectorFromDynamic = <StateType = any, ReturnType = unknown>(
  dynamicSelectorFn: DynamicSelectorFn<ReturnType>,
  ...paramsAndOtherArgs: DynamicSelectorArgsWithoutState
): Selector<StateType, ReturnType> => {
  return (state) => dynamicSelectorFn(state, ...paramsAndOtherArgs);
};

export { reselectSelectorFromDynamic };
