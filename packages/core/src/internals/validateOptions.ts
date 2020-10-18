import { DynamicSelectorOptions, DynamicSelectorStateOptions } from '../types';

const validateOptions = (options: DynamicSelectorOptions) => {
  /* istanbul ignore next */
  if (process.env.NODE_ENV !== 'production') {
    const {
      compareResult,
      createResultCache,
      debug,
      displayName,
      getKeyForParams,
      onError,
      ...unrecognizedOptions
    } = options;

    const unrecognizedStateOptionKeys = Object.keys(unrecognizedOptions);
    if (unrecognizedStateOptionKeys.length) {
      console.error(
        `Unrecognized options provided for selector: ${unrecognizedStateOptionKeys.join(', ')}`,
        unrecognizedOptions,
      );
    }

    if (!createResultCache) {
      console.error('Selector options must provide `createResultCache`', options);
    }
    if (!getKeyForParams) {
      console.error('Selector options must provide `getKeyForParams`', options);
    }
  }
};

const validateStateOptions = (stateOptions: DynamicSelectorStateOptions) => {
  /* istanbul ignore next */
  if (process.env.NODE_ENV !== 'production') {
    const { compareState, get, defaultSelectorOptions, ...unrecognizedStateOptions } = stateOptions;

    const unrecognizedStateOptionKeys = Object.keys(unrecognizedStateOptions);
    if (unrecognizedStateOptionKeys.length) {
      console.error(
        `Unrecognized stateOptions provided for dynamicSelectorForState: ${unrecognizedStateOptionKeys.join(
          ', ',
        )}`,
        unrecognizedStateOptions,
      );
    }

    if (!get) {
      console.error('stateOptions must provide `get`', stateOptions);
    }

    if (defaultSelectorOptions) {
      validateOptions(defaultSelectorOptions);
    }
  }
};

export { validateStateOptions, validateOptions };
