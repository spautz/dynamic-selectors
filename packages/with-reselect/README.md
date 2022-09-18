# @dynamic-selectors/with-reselect

Helper functions to make it easy to use [Dynamic Selectors](https://github.com/spautz/dynamic-selectors) and
[Reselect](https://github.com/reduxjs/reselect) together.

For more information or related packages, see the [Dynamic Selectors workspace](https://github.com/spautz/dynamic-selectors).

[![npm version](https://img.shields.io/npm/v/@dynamic-selectors/with-reselect.svg)](https://www.npmjs.com/package/@dynamic-selectors/with-reselect)
[![build status](https://github.com/spautz/dynamic-selectors/workflows/CI/badge.svg)](https://github.com/spautz/dynamic-selectors/actions)
[![test coverage](https://coveralls.io/repos/github/spautz/dynamic-selectors/badge.svg?branch=x-cov-with-reselect)](https://coveralls.io/github/spautz/dynamic-selectors?branch=x-cov-with-reselect)
[![dependencies status](https://img.shields.io/librariesio/release/npm/@dynamic-selectors/with-reselect.svg)](https://libraries.io/github/spautz/dynamic-selectors)
[![gzip size](https://img.badgesize.io/https://unpkg.com/@dynamic-selectors/with-reselect@latest/dist/index.js?compression=gzip)](https://bundlephobia.com/result?p=@dynamic-selectors/with-reselect)

## What's included

```
import {
  reselectSelectorFromDynamic,
  dynamicSelectorFromReselect,
  wrapReselect,
} from '@dynamic-selectors/with-reselect';
```

### reselectSelectorFromDynamic(dynamicSelector, params?)

Create a Reselect selector from any dynamic selector. You can specify the params to use with the dynamic selector,
if it accepts params.

```javascript
const originalSelector = createDynamicSelector(/* dynamic-selector for use with reselect */);
const newSelector = reselectSelectorFromDynamic(originalSelector);
```

### dynamicSelectorFromReselect(reselectSelector)

Creates a normal dynamic selector from any Reselect selector (using `createDynamicSelector`, by default).
If you're using a custom dynamic selector factory, you should use `wrapReselect` instead.

```javascript
const originalSelector = createSelector(/* reselect selector for use with dynamic-selectors */);
const newSelector = dynamicSelectorFromReselect(originalSelector);
```

### wrapReselect(reselectSelector)

Converts any Reselect selector into a function that you can pass to your own customized dynamic selector factory.
The default `dynamicSelectorFromReselect` helper is just shorthand for `createDynamicSelector(wrapSelector(selectorFn))`

```javascript
const myCustomSelectorFactory = dynamicSelectorForState(/* custom options */);

const originalSelector = createSelector(/* custom dynamic-selector for use with reselect */);
const newSelector = myCustomSelectorFactory(wrapSelector(originalSelector));
```
