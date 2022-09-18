import type { DynamicSelectorOptions, DynamicSelectorStateOptions } from '../types.js';

const validateOptions = (options: DynamicSelectorOptions) => {
  /* c8 ignore start */
  if (process.env.NODE_ENV !== 'production') {
    const {
      compareResult: _compareResult,
      createResultCache,
      debug: _debug,
      displayName: _displayName,
      getKeyForParams,
      onError: _onError,
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
  /* c8 ignore stop */
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validateStateOptions = (stateOptions: DynamicSelectorStateOptions<any>) => {
  /* c8 ignore start */
  if (process.env.NODE_ENV !== 'production') {
    const {
      compareState: _compareState,
      get,
      defaultSelectorOptions,
      ...unrecognizedStateOptions
    } = stateOptions;

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
  /* c8 ignore stop */
};

export { validateStateOptions, validateOptions };
