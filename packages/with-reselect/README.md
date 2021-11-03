# @dynamic-selectors/with-reselect

[![npm version](https://img.shields.io/npm/v/@dynamic-selectors/with-reselect.svg)](https://www.npmjs.com/package/@dynamic-selectors/with-reselect)
[![dependencies status](https://img.shields.io/david/spautz/dynamic-selectors.svg?path=packages/with-reselect)](https://david-dm.org/spautz/dynamic-selectors?path=packages/with-reselect)
[![dependencies status](https://img.shields.io/librariesio/release/npm/@dynamic-selectors/core.svg)](https://david-dm.org/spautz/dynamic-selectors?path=packages/core)
[![gzip size](https://img.badgesize.io/https://unpkg.com/@dynamic-selectors/with-reselect@latest/dist/with-reselect.cjs.production.min.js?compression=gzip)](https://bundlephobia.com/result?p=@dynamic-selectors/with-reselect@latest)

Helper functions to make it easy to use [Dynamic Selectors](https://github.com/spautz/dynamic-selectors) and
[Reselect](https://github.com/reduxjs/reselect) together.

## What's included

```
import {
  reselectSelectorFromDynamic,
  dynamicSelectorFromReselect,
  wrapReselect,
} from '@dynamic-selectors/with-reselect';
```

#### `reselectSelectorFromDynamic(dynamicSelector, params?)`

Create a Reselect selector from any dynamic selector. You can specify the params to use with the dynamic selector,
if it accepts params.

```javascript
const originalSelector = createDynamicSelector(/* dynamic-selector for use with reselect */);
const newSelector = reselectSelectorFromDynamic(originalSelector);
```

#### `dynamicSelectorFromReselect(reselectSelector)`

Creates a normal dynamic selector from any Reselect selector (using `createDynamicSelector`). If you're using a custom
dynamic selector factory, you should use `wrapReselect` instead.

```javascript
const originalSelector = createSelector(/* reselect selector for use with dynamic-selectors */);
const newSelector = dynamicSelectorFromReselect(originalSelector);
```

#### `wrapReselect(reselectSelector)`

Converts any Reselect selector into a function that you can pass to your own customized dynamic selector factory.
The default `dynamicSelectorFromReselect` helper is just shorthand for `createDynamicSelector(wrapSelector(selectorFn))`

```javascript
const myCustomSelectorFactory = dynamicSelectorForState(/* custom options */);

const originalSelector = createSelector(/* custom dynamic-selector for use with reselect */);
const newSelector = myCustomSelectorFactory(wrapSelector(originalSelector));
```
