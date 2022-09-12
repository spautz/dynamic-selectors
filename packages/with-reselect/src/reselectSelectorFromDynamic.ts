import type { DynamicSelectorFnFromTypes, DynamicSelectorParams } from '@dynamic-selectors/core';
import type { Selector } from 'reselect';

const reselectSelectorFromDynamic = <StateType = unknown, ReturnType = unknown>(
  dynamicSelectorFn: DynamicSelectorFnFromTypes<ReturnType, StateType>,
  ...paramsAndOtherArgs: [DynamicSelectorParams, ...Array<unknown>]
): Selector<StateType, ReturnType> => {
  return (state) => dynamicSelectorFn(state, ...paramsAndOtherArgs);
};

export { reselectSelectorFromDynamic };
