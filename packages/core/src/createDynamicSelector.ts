import lodashGet from 'lodash/get';
import shallowEqual from 'shallowequal';

import { dynamicSelectorForState } from './dynamicSelectorForState';
import { DynamicSelectorResultCache, DynamicSelectorResultEntry } from './internals';
import { DynamicSelectorOptions, DynamicSelectorStateOptions } from './types';

/**
 * Default cache
 */
const createDefaultCache = (): DynamicSelectorResultCache => {
  // @TODO: use LimitedCache
  let resultCache: Record<string, DynamicSelectorResultEntry> = {};

  return {
    has: (paramKey) => resultCache.hasOwnProperty(paramKey),
    get: (paramKey) => resultCache[paramKey],
    getAll: () => resultCache,
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
  compareResult: shallowEqual,
  getKeyForParams: JSON.stringify,
  onException: null,
  createResultCache: createDefaultCache,
};

/**
 * Default options for a normal state: referential equality and reasonable default options.
 */
const defaultStateOptions: DynamicSelectorStateOptions = {
  compareState: (oldReturnValue, newReturnValue) => oldReturnValue === newReturnValue,
  get: lodashGet,
  defaultSelectorOptions,
};

/**
 * The default createDynamicSelector: this uses reasonable defaults that work out of the box.
 */
const createDynamicSelector = dynamicSelectorForState(defaultStateOptions);

export { createDefaultCache, defaultStateOptions, defaultSelectorOptions, createDynamicSelector };
