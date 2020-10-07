import lodashGet from 'lodash/get';
import shallowEqual from 'shallowequal';

import dynamicSelectorForState from './dynamicSelectorForState';
import { DynamicSelectorOptions, DynamicSelectorStateOptions } from './types';

/**
 * Default options for a normal state:
 */
const defaultSelectorOptions: DynamicSelectorOptions = {
  compareResult: (oldReturnValue, newReturnValue) => oldReturnValue === newReturnValue,
  debug: false,
  getKeyForParams: JSON.stringify,
  onException: null,
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
export default dynamicSelectorForState(defaultStateOptions);
export { defaultStateOptions, defaultSelectorOptions };
