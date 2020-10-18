# @dynamic-selectors/with-reselect

**This package is in active development. Things will change rapidly, and it is not yet production-ready. Feedback is welcome.**

**Release `0.1.0` will be the first stable, production-ready version.**

[![npm version](https://img.shields.io/npm/v/@dynamic-selectors/with-reselect.svg)](https://www.npmjs.com/package/@dynamic-selectors/with-reselect)
[![dependencies status](https://img.shields.io/david/spautz/dynamic-selectors.svg?path=packages/with-reselect)](https://david-dm.org/spautz/dynamic-selectors?path=packages/with-reselect)
[![gzip size](https://img.badgesize.io/https://unpkg.com/@dynamic-selectors/with-reselect@latest/dist/with-reselect.cjs.production.min.js?compression=gzip)](https://bundlephobia.com/result?p=@dynamic-selectors/with-reselect@latest)

Helper functions to make it easy to use [Dynamic Selectors](https://github.com/spautz/dynamic-selectors) and
[Reselect](https://github.com/reduxjs/reselect) together.

## Usage

```
import {
  createReselectSelectorFromDynamic,
  createDynamicSelectorFromReselect,
  wrapReselect,
} from '@dynamic-selectors/with-reselect';
```

#### `createReselectSelectorFromDynamic(dynamicSelector, params?)`

```javascript
const originalSelector = createDynamicSelector(...);
const newSelector = createReselectSelectorFromDynamic(originalSelector);
```

#### `createDynamicSelectorFromReselect(reselectSelector)`

```javascript
const originalSelector = createSelector(...);
const newSelector = createDynamicSelectorFromReselect(originalSelector);
```

#### `wrapReselect(reselectSelector)`

```javascript
const myCustomSelectorFactory = dynamicSelectorForState(...);

const originalSelector = createSelector(...);
const newSelector = myCustomSelectorFactory(wrapSelector(originalSelector));
```
