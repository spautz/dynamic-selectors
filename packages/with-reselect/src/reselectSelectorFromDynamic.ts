import {
  DefaultReturnType,
  DefaultStateType,
  DynamicSelectorArgsWithoutState,
  DynamicSelectorFn,
} from '@dynamic-selectors/core';
import { Selector } from 'reselect';

const reselectSelectorFromDynamic = <StateType = DefaultStateType, ReturnType = DefaultReturnType>(
  dynamicSelectorFn: DynamicSelectorFn<ReturnType>,
  ...paramsAndOtherArgs: DynamicSelectorArgsWithoutState
): Selector<StateType, ReturnType> => {
  return (state) => dynamicSelectorFn(state, ...paramsAndOtherArgs);
};

export { reselectSelectorFromDynamic };
