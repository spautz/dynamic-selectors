import { get } from 'lodash-es';
import shallowEqual from 'shallowequal';

import { dynamicSelectorForState } from './dynamicSelectorForState';
import type { DynamicSelectorResultCache, DynamicSelectorResultEntry } from './internals';
import type {
  DefaultStateType,
  DynamicSelectorFn,
  DynamicSelectorOptions,
  DynamicSelectorParams,
  DynamicSelectorStateAccessor,
  DynamicSelectorStateOptions,
  InternalExtraArgsType,
} from './types';
import { DynamicSelectorInnerFn } from './types';

/**
 * Default cache for dynamic-selector call results
 */
const createDefaultCache = (): DynamicSelectorResultCache => {
  // @TODO: use LimitedCache
  const resultCache: Record<string, DynamicSelectorResultEntry> = {};

  return {
    get: (paramKey) => resultCache[paramKey],
    getAll: () => resultCache,
    set: (paramKey, newEntry) => {
      resultCache[paramKey] = newEntry;
    },
  };
};

/**
 * Default options for a normal state:
 */
const defaultSelectorOptions: DynamicSelectorOptions = {
  compareResult: shallowEqual,
  getKeyForParams: JSON.stringify,
  onError: null,
  createResultCache: createDefaultCache,
};

/**
 * Default options for a normal state: referential equality and reasonable default options.
 */
const defaultStateOptions: DynamicSelectorStateOptions = {
  compareState: (oldReturnValue, newReturnValue) => oldReturnValue === newReturnValue,
  get,
  defaultSelectorOptions,
};

/**
 * An easier-to-read version of the return type of dynamicSelectorForState
 */
type CreateDynamicSelectorFn = <InnerFn extends DynamicSelectorInnerFn<any>>(
  selectorFn: InnerFn,
  // selectorFn: DynamicSelectorInnerFn<ReturnType, StateType, ParamsType, ExtraArgsType>,
  options?: Partial<DynamicSelectorOptions<ReturnType<InnerFn>>>,
) => DynamicSelectorFn<DefaultStateType, InnerFn>;

/**
 * The default createDynamicSelector: this uses reasonable defaults that work out of the box.
 */
const createDynamicSelector: CreateDynamicSelectorFn = dynamicSelectorForState(defaultStateOptions);

export { createDefaultCache, defaultStateOptions, defaultSelectorOptions, createDynamicSelector };
