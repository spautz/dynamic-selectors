import lodashGet from 'lodash/get';
import shallowEqual from 'shallowequal';

import { dynamicSelectorForState } from './dynamicSelectorForState';
import { DynamicSelectorResultCache, DynamicSelectorResultEntry } from './internals';
import { DynamicSelectorOptions, DynamicSelectorStateOptions } from './types';

/**
 * Default cache
 */
const createDefaultCache = (): DynamicSelectorResultCache => {
  // @TODO: LimitedCache
  let resultCache: Record<string, DynamicSelectorResultEntry> = {};

  return {
    has: (paramKey) => resultCache.hasOwnProperty(paramKey),
    get: (paramKey) => resultCache[paramKey],
    set: (paramKey, newEntry) => {
      resultCache[paramKey] = newEntry;
    },
    reset: () => {
      resultCache = {};
    },
  };
};

/**
 * Default options for a normal state:
 */
const defaultSelectorOptions: DynamicSelectorOptions = {
  compareResult: (oldReturnValue, newReturnValue) => oldReturnValue === newReturnValue,
  getKeyForParams: JSON.stringify,
  onException: null,
  createResultCache: createDefaultCache,
};

/**
 * Default options for a normal state: referential equality and reasonable default options.
 */
const defaultStateOptions: DynamicSelectorStateOptions = {
  compareState: shallowEqual,
  get: lodashGet,
  defaultSelectorOptions,
};

/**
 * The default entry point for creating Dynamic Selectors: this uses reasonable defaults that work out of the box.
 */
const createDynamicSelector = dynamicSelectorForState(defaultStateOptions);

export { createDefaultCache, defaultStateOptions, defaultSelectorOptions, createDynamicSelector };
