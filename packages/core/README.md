# @dynamic-selectors/core

Selectors with parameters and dynamic dependencies.

See **[Selector Comparison](https://github.com/spautz/dynamic-selectors/blob/main/packages/core/docs/comparison-with-reselect.md)** for a walkthrough.

[![npm version](https://img.shields.io/npm/v/@dynamic-selectors/core.svg)](https://www.npmjs.com/package/@dynamic-selectors/core)
[![build status](https://github.com/spautz/dynamic-selectors/workflows/CI/badge.svg)](https://github.com/spautz/dynamic-selectors/actions)
[![test coverage](https://coveralls.io/repos/github/spautz/dynamic-selectors/badge.svg?branch=x-cov-core)](https://coveralls.io/github/spautz/dynamic-selectors?branch=x-cov-core)
[![dependencies status](https://img.shields.io/librariesio/release/npm/@dynamic-selectors/core.svg)](https://libraries.io/github/spautz/dynamic-selectors)
[![gzip size](https://img.badgesize.io/https://unpkg.com/@dynamic-selectors/core@latest/dist/index.js?compression=gzip)](https://bundlephobia.com/result?p=@dynamic-selectors/core)

Dynamic selectors can access state dynamically and call each other like plain functions, even conditionally or within loops, without needing
to register dependencies up-front. Like Reselect and Re-reselect, selectors are only re-run when necessary.

This may be used with a state library like Redux, or on its own as a general memoization util.

For more information or related packages, see the [Dynamic Selectors workspace](https://github.com/spautz/dynamic-selectors).

## Example

```javascript
import { createDynamicSelector } from '@dynamic-selectors/core';
```

Dynamic selectors can access state via a deep-get helper:

```javascript
const getBooksForAuthor = createDynamicSelector((getState) => {
  const books = getState('books');
  const authorFilter = getState('authorFilter');

  return books.filter((book) => book.author === authorFilter);
});
```

Selectors can call other selectors inline -- even in loops:

```javascript
const getBookInfo = createDynamicSelector((getState, bookId) => {
  const rawBookData = getState(`bookInfo[${bookId}]`);
  return new Book(rawBookData);
});

const getBooksForAuthor = createDynamicSelector((getState, authorId) => {
  const bookIds = getState(['booksByAuthor', authorId]);
  return bookIds.map((bookId) => getBookInfo(bookId));
});
```

`getBooksForAuthor(authorId)` is cached, and will only rerun when its dependencies change: `state.booksByAuthor[authorId]`
or one of the `getBookInfo(bookId)` calls it made. The return value is cached per `authorId`.

`getBookInfo(bookId)` is cached similarly, and will only rerun when `state.bookInfo[bookId]` changes. The same cache is
used if you call `getBookInfo(state, bookId)` directly.

## Features

<dl>
  <dt>Pass arguments to selector functions</dt>
  <dd>
    Results are memoized by the params you pass to a selector, so <code>selectBooks({ authorId: 3 })</code> and
    <code>selectBooks({ authorId: 4 })</code> will work properly and be cached independently.
  </dd>

  <dt>Call selectors from within selectors</dt>
  <dd>
    A selector can call other selectors from <code>if</code> blocks, loops, or any other controls -- or even recursively.
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

[**_Comparison between Reselect and Dyanamic Selectors_**](https://github.com/spautz/dynamic-selectors/blob/main/packages/core/docs/comparison-with-reselect.md)

## API

Your selector function receives two arguments: `getState` and `params` (optional). Any additional arguments provided
when calling the selector will be passed through as well, although they don't do anything.

- `getState<T>(path: string | Array<string>, defaultValue?: T)` lets you access any path in `state`. It works like [lodash's get](https://lodash.com/docs#get).
- `params` (optional) can be anything you want, but it's best as either a single primitive value or a flat object containing a few values -- similar to route params.

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

### Typings

In Typescript, the return type of the selector -- as well as any typings for its `params` or additional arguments --
will be inferred from the type of the function passed into it.

```typescript
const selector1 = createDynamicSelector(() => 3);
const value1 = selector1(); // type: number

const selector2 = createDynamicSelector(() => 'Hello');
const value2 = selector2(); // type: string

const selector3 = createDynamicSelector(
  (getState, userId: number): UserModel => getState(['users', userId]),
);
const value3 = selector2(state, 123); // type: UserModel
const value4 = selector2(state, true); // error
```

Inside a selector, `getState` can be assigned a specific return type. (Default: `unknown`)

```typescript
createDynamicSelector((getState) => {
  const value1 = getState<number>('path.to.number'); // type: number
  const value2 = getState<boolean>('path.to.boolean', false); // type: boolean
  const value3 = getState<string>('path.to.string', false); // error: defaultValue doesn't match string
});
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

### Selector Options

When creating a selector, you can pass a second argument with [options](https://github.com/spautz/dynamic-selectors/blob/main/packages/core/src/types.ts#L63-L90)
to customize its behavior.

```javascript
const mySelectorFn = createSelectorFn(fn, options);
```

#### `compareResult` (function(oldValue, newValue): boolean, default: `shallowEqual`)

After a selector runs, compares its previous cached value to the newly-returned value. Return true to discard the
new value and reuse the previous value instead. This is useful for selectors that return arrays or other objects
which may be new instances but do not actually contain new values.

#### `createResultCache` (function(): DynamicSelectorResultCache, default: plain object)

Used to customize the cache where results are stored. The cache must implement `get(cacheKey: string)` and
`set(cacheKey: string, value: any)`. To limit the cache size or cache time using [Limited-Cache](https://github.com/spautz/limited-cache)
you would customize this like:

```javascript
createDynamicSelector(fn, {
  createResultCache: () => LimitedCache({ maxCacheSize: 100, maxCacheTime: 60 * 1000 }),
});
```

#### `debug` (boolean | string, default: false, development only)

Verbose output: logs all selector activity to the console (runs, cache-checks, results, etc).

#### `displayName` (string, default: displayName of your function)

Sets the displayName of the returned selector function, and includes it in verbose debug output (if enabled.)

#### `getKeyForParams` (function(params): string, default: `JSON.stringify`)

Generates a string cache key that represents the params. To get constant hashes even when object properties are
in a different order from one call to the next, you would customize this like:

Example using [node-object-hash](https://github.com/SkeLLLa/node-object-hash):

```javascript
var hashSortCoerce = hasher({ sort: true, coerce: true });
createDynamicSelector(fn, {
  getKeyForParams: (params) => JSON.stringify(hashSortCoerce(params)),
});
```

Example using [object-hash](https://github.com/puleos/object-hash):

```javascript
createDynamicSelector(fn, {
  getKeyForParams: hash,
});
```

#### `onError` (function(error, selectorArgs, selectorFn): any, default: null)

Called if the selector function throws an exception. This may recover from the exception -- and supply a new return
value for the selector -- by returning any non-`undefined` value.

If `onError` is not set, or if it does not return a value when it runs, then the error will be re-thrown.

### State Options

In addition to the per-selector options above, you can set [state-level options](https://github.com/spautz/dynamic-selectors/blob/main/packages/core/src/types.ts#L48-L61)
which control the selectors' interactions with state and with other selectors.

This gives you a new selector-creating function: use that instead of the default `createDynamicSelector`.

This becomes a "zero dependencies" library if you override the default options to not use `shallowEqual` and lodash's `get`.

```javascript
const mySelectorFactory = dynamicSelectorForState(stateOptions);
const mySelectorFn = mySelectorFactory(fn, options);
```

Each distinct `stateOptions` should represent a separate store or type of state. You may mix-and-match selectors for
different `stateOptions`, but this may not work as expected: please contact me if you're doing that because I'd love to
know more about your specific use case.

#### `compareState` (function(oldState, newState): boolean, default: `===`)

Compares the current state to the state a selector last ran for. Return true to indicate that state is unchanged.
A selector that's called with the same `state` and `params` will always use its cache.

#### `get` (function<T>(state, pathString, defaultValue?): T, default: `_.get`)

Accessor to retrieve a value from the state. The path will always be a string. To completely avoid lodash, you can
customize this to use something like [tiny-get](https://github.com/NickGard/tiny-get) instead.

#### `defaultSelectorOptions` ([selector options](#options), default: [options](https://github.com/spautz/dynamic-selectors/blob/main/packages/core/src/createDynamicSelector.ts#L29-L37))

The default, base options that will be used for each selector (unless overridden when creating the selector.)
