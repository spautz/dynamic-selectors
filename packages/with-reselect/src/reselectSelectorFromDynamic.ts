import { DynamicSelectorArgsWithoutState, DynamicSelectorFn } from '@dynamic-selectors/core';

const createReselectSelectorFromDynamic = <StateType = any, ReturnType = any>(
  dynamicSelectorFn: DynamicSelectorFn<ReturnType>,
  ...paramsAndOtherArgs: DynamicSelectorArgsWithoutState
) => {
  return (state: StateType) => dynamicSelectorFn(state, ...paramsAndOtherArgs);
};

export { createReselectSelectorFromDynamic };
