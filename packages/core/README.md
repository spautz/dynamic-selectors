# @dynamic-selectors/core

[![npm version](https://img.shields.io/npm/v/@dynamic-selectors/core/latest.svg)](https://www.npmjs.com/package/@dynamic-selectors/core)
[![gzip size](https://img.shields.io/bundlephobia/minzip/@dynamic-selectors/core)](https://bundlephobia.com/result?p=@dynamic-selectors/core@latest)

Selectors with parameters and dynamic dependencies.

Dynamic selectors can access state and call each other dynamically, even conditionally or within loops, without needing
to register dependencies up-front. As with Reselect and Re-reselect, functions are only re-run when necessary.

For more information or related packages, see the [Dynamic Selectors workspace](https://github.com/spautz/dynamic-selectors).

## Example

(This is based on [Re-reselect's example](https://github.com/toomuchdesign/re-reselect#readme).)

```javascript
import { createDynamicSelector } from '@dynamic-selectors/core';

// First selector: does a lookup based on its param
const getLibraryId = createDynamicSelector((getState, libraryName) =>
  getState(`libraries[${libraryName}].id`),
);

// Second selector:
const getUsersByLibrary = createDynamicSelector((getState, libraryName) => {
  const users = getState('users');
  const libraryId = getLibraryId(libraryName);

  if (libraryId) {
    return expensiveComputation(users, libraryId);
  }
  return null;
});

getUsersByLibrary(state, 'react');
getUsersByLibrary(state, 'vue');
getUsersByLibrary(state, 'react'); // this hits the cache
```

`getUsersByLibrary(state, 'react')` will rerun only when its dependencies change: `state.users` or `getLibraryId('react')`.

This could also be built without using `getLibraryId`: the `getUsersByLibrary` selector could just use `getState`
to read from `` `libraries[${libraryName}].id` ``, and it would work the same.

## Features

- Dynamic, automatically-registered dependencies. Instead of listing your selector's dependencies up-front, just call
  them within your function.
- Provide arguments/parameters to selectors. Each set of arguments gets its own cache, like in re-reselect.
- Cache controls: "freeze" a selector's output even if it returned a new object.
- Access state directly from within a selector. This automatically registers a dependency against that location in your `state`.
- A selector can call other selectors from `if` blocks, loops, or any other controls -- or even recursively.

## How is this different from Reselect and Re-reselect?

[See syntax comparison here](./docs/comparison-with-reselect.md).

Because you call other selectors _within your selector_, instead of listing them up-front, they can be called
dynamically: Reselect selectors cannot be called conditionally, nor from within loops, nor recursively.

You can also "freeze" a selector whose output isn't significantly different from its prior output -- e.g., an array
which may contain the same elements, even if it's a new array instance. This prevents cascading updates when a
selector returns a new value which is not _really_ new: the selectors that called it will not detect a change.
