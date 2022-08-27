# @dynamic-selectors/core

Selectors with parameters and dynamic dependencies. See [Selector Comparison](https://github.com/spautz/dynamic-selectors/blob/main/packages/core/docs/comparison-with-reselect.md).

[![npm version](https://img.shields.io/npm/v/@dynamic-selectors/core.svg)](https://www.npmjs.com/package/@dynamic-selectors/core)
[![build status](https://github.com/spautz/dynamic-selectors/workflows/CI/badge.svg)](https://github.com/spautz/dynamic-selectors/actions)
[![test coverage](https://coveralls.io/repos/github/spautz/dynamic-selectors/badge.svg?branch=x-cov-core)](https://coveralls.io/github/spautz/dynamic-selectors?branch=x-cov-core)
[![dependencies status](https://img.shields.io/librariesio/release/npm/@dynamic-selectors/core.svg)](https://libraries.io/github/spautz/dynamic-selectors)
[![gzip size](https://img.badgesize.io/https://unpkg.com/@dynamic-selectors/core@latest/dist/index.js?compression=gzip)](https://bundlephobia.com/result?p=@dynamic-selectors/core)

Dynamic selectors can access state and call each other dynamically, even conditionally or within loops, without needing
to register dependencies up-front. As with Reselect and Re-reselect, functions are only re-run when necessary.

This may be used with a state library like Redux, or on its own as a general memoization util.

For more information or related packages, see the [Dynamic Selectors workspace](https://github.com/spautz/dynamic-selectors).

## Example

```javascript
import { createDynamicSelector } from '@dynamic-selectors/core';

// Simple selectors can access state, like normal
const getAuthor = createDynamicSelector((getState, authorId) => {
  return getState(`authors[${authorId}]`);
});

// Selectors can call other selectors inline -- even in loops
const getBooksForAuthor = createDynamicSelector((getState, authorId) => {
  const author = getAuthor(authorId);
  if (author) {
    return author.bookIds.map((bookId) => getState(`books[${bookId}]`));
  }
  // Else: throw, return default value, etc
});

// Because selector-to-selector calls are dynamic, it's easier to compose and reuse them
const getBooksForMultipleAuthors = createDynamicSelector((getState, authorIds) => {
  return authorIds.map(getBooksForAuthor);
});

// Each selector in the stack maintains its own cache
getBooksForMultipleAuthors(state, [1, 2, 3]);
getBooksForMultipleAuthors(state, [4, 5, 6]);
// This reuses the cached values from the earlier calls
getBooksForMultipleAuthors(state, [1, 2, 3, 4, 5, 6]);
```

`getBooksForAuthor(authorId)` will be rerun only when its dependencies change: `state.authors[authorId]` or one of the
`state.books[bookId]` values it accessed.

The result is cached per `authorId`. The same cache is used if you call `getBooksForAuthor(state, authorId)` directly.

`getBooksForMultipleAuthors(state, authorIds)` will be cached the same way: it will rerun only when one of its
`getBooksForAuthor` dependencies has changed. Dependencies can be state values (from `getState`), or other dynamic
selectors.

## Features

<dl>
  <dt>Pass arguments to selector functions</dt>
  <dd>
    Results are memoized by the params you pass to a selector, so <code>selectBooks({ authorId: 3 })</code> and
    <code>selectBooks({ authorId: 4 })</code> will work properly and be cached independently.
  </dd>

  <dt>Call selectors from within selectors</dt>
  <dd>
    A selector can call other selectors from `if` blocks, loops, or any other controls -- or even recursively.
  </dd>

  <dt>Auto-detected dependencies</dt>
  <dd>
    When a selector runs, any secondary selectors it calls get marked as dependencies. It won't re-run unless those
    dependencies return something new. The dependencies can change from one run to the next.
  </dd>

  <dt>Equality comparisons / caching strategy</dt>
  <dd>
    Like the <a href="https://react-redux.js.org/api/hooks#equality-comparisons-and-updates"><code>useSelector</code>
    hook</a>, you can specify your own comparison function to 'freeze' updates. This may be customized for each selector.
  </dd>
</dl>

[Syntax comparison between Reselect and Dyanamic Selectors](https://github.com/spautz/dynamic-selectors/blob/main/packages/core/docs/comparison-with-reselect.md).

## API

Your selector function receives two arguments: `getState` and `params` (optional).

- `getState(path: string, defaultValue?: any)` lets you access any path in `state`. It works like [lodash's get](https://lodash.com/docs#get).
- `params` (optional) can be anything you want, but it's best as either a single primitive value or a small object containing a few values -- like route params.

The selector's results will be cached using `params`. See [Options](#options) to customize the cache key generation.

### Calling a dynamic selector

To call a selector, pass it your `state` and `params` (optional).

When calling one selector from within another, pass `params` only.

```javascript
const getRawList = createDynamicSelector((getState, { listId }) => {
  return getState(`lists.${listId}`);
});

const getSortedList = createDynamicSelector((getState, { listId, sortField }) => {
  // `state` is automatically pased through when one selector calls another
  const rawList = getRawList({ listId });
  if (rawList && sortField) {
    return sortBy(rawList, sortField);
  }
  return rawList;
});

getSortedList(state, { listId: 123, sortField: 'title' });
```

### Additional selector properties

These are attached to the selector function returned by `createDynamicSelector`.

#### `selector.getCachedResult()`

If there's a usable cached value for the current state and params, it will be returned. Returns `undefined` otherwise.

Call this just like the selector itself (i.e., `(state, params)` from outside, `(params)` from inside a selector).

#### `selector.hasCachedResult()`

Returns a boolean to indicate whether or not there's a usable value in cache for the current state and params.

Call this just like the selector itself (i.e., `(state, params)` from outside, `(params)` from inside a selector).

#### `selector.resetCache()`

Re-initializes the cache of previous results.

#### `selector.getDebugInfo()` (development only)

Returns an object with statistics about the selector's activity (runs, cache-checks, results, etc.)

#### `selector.isDynamicSelector` (always `true`)

The canonical way to detect that a function is a dynamic selector.

### Options

When creating a selector, you can pass a second argument with [options](https://github.com/spautz/dynamic-selectors/blob/main/packages/core/src/types.ts#L29-L48)
to customize its behavior.

```javascript
const mySelectorFn = createSelectorFn(fn, options);
```

#### `compareResult` (function(oldValue, newValue), default: `shallowEqual`)

After a selector runs, compares its previous cached value to the newly-returned value. Return true to discard the
new value and reuse the previous value instead. This is useful for selectors that return arrays or other objects
which may be new instances but do not actually contain new values.

#### `createResultCache` (function(), default: plain object)

Used to customize the cache where results are stored. The cache must implement `get(cacheKey: string)` and
`set(cacheKey: string, value: any)`. To limit the cache size or cache time using [Limited-Cache](https://github.com/spautz/limited-cache)
you would customize this like:

```javascript
createDynamicSelector(myFn, {
  createResultCache: () => LimitedCache({ maxCacheSize: 100, maxCacheTime: 60 * 1000 }),
});
```

#### `debug` (boolean | string, default: false, development only)

Verbose output: logs all selector activity (runs, cache-checks, results, etc) to the console.

#### `displayName` (string, default: displayName of your function)

Sets the displayName of the returned selector function, and includes it in verbose debug output (if enabled.)

#### `getKeyForParams` (function(params), default: `JSON.stringify`)

Generates a string cache key that represents the params. To get constant hashes even when object properties are
in different orders from one call to the next, you would customize this like:

Example using [node-object-hash](https://github.com/SkeLLLa/node-object-hash):

```javascript
var hashSortCoerce = hasher({ sort: true, coerce: true });
createDynamicSelector(myFn, {
  getKeyForParams: (params) => JSON.stringify(hashSortCoerce(params)),
});
```

Example using [object-hash](https://github.com/puleos/object-hash):

```javascript
createDynamicSelector(myFn, {
  getKeyForParams: hash,
});
```

#### `onError` (function(error, selectorArgs, selectorFn), default: null)

Called if the selector function throws an exception. This may recover from the exception -- and supply a new return
value for the selector -- by returning any non-`undefined` value.

If `onError` is not set, or if it does not return a value when it runs, then the error will be re-thrown.

### State-Level Options

In addition to the per-selector options above, you can set [state-level options](https://github.com/spautz/dynamic-selectors/blob/main/packages/core/src/types.ts#L11-L24)
which control the selectors' interactions with state and with other selectors.

This gives you a new selector-creating function: use that instead of the default `createDynamicSelector`.
This becomes a "zero dependencies" library if you override the default options to not use `shallowEqual` and `_.get`.

```javascript
const mySelectorFactory = dynamicSelectorForState(stateOptions);
const mySelectorFn = mySelectorFactory(fn, options);
```

Each distinct `stateOptions` represents a separate store or type of state. You may mix-and-match selectors for
different `stateOptions`, but this may not work as expected: please contact me if you're doing that to let me know
your specific use case.

#### `compareState` (function(oldState, newState), default: `===`)

Compares the current state to the state a selector last ran for. Return true to indicate that state is unchanged.
A selector that's called with the same `state` and `params` will always use its cache.

#### `get` (function(state, pathString, defaultValue?), default: `_.get`)

Accessor to retrieve a value from the state. The path will always be a string. To completely avoid lodash, you can
customize this to use something like [tiny-get](https://github.com/NickGard/tiny-get) instead.

#### `defaultSelectorOptions` ([selector options](#options), default: [options](https://github.com/spautz/dynamic-selectors/blob/main/packages/core/src/createDynamicSelector.ts#L24-L32))

The default, base options that will be used for each selector (unless overridden when creating the selector.)
