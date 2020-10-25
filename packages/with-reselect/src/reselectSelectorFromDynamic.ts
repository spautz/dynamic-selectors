import { DynamicSelectorArgsWithoutState, DynamicSelectorFn } from '@dynamic-selectors/core';

const reselectSelectorFromDynamic = <StateType = any, ReturnType = any>(
  dynamicSelectorFn: DynamicSelectorFn<ReturnType>,
  ...paramsAndOtherArgs: DynamicSelectorArgsWithoutState
) => {
  return (state: StateType) => dynamicSelectorFn(state, ...paramsAndOtherArgs);
};

export { reselectSelectorFromDynamic };
