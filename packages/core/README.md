# @dynamic-selectors/core

**This package is in active development. Things will change rapidly, and it is not yet production-ready. Feedback is welcome.**

**Release `0.1.0` will be the first stable, production-ready version.**

[![npm version](https://img.shields.io/npm/v/@dynamic-selectors/core/latest.svg)](https://www.npmjs.com/package/@dynamic-selectors/core)
[![gzip size](https://img.shields.io/bundlephobia/minzip/@dynamic-selectors/core)](https://bundlephobia.com/result?p=@dynamic-selectors/core@latest)

Selectors with parameters and dynamic dependencies.

Selectors can access state and call each other dynamically, even conditionally or within loops, without needing to
register dependencies up-front. As with Reselect and Re-reselect, functions are only re-run when necessary.

This is the core functionality for [Dynamic Selectors](https://github.com/spautz/dynamic-selectors)

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

`getUsersByLibrary(state, 'react')` will rerun only when its dependencies change: `state.users` or
`getLibraryId('react')`. This could also be built without using `getLibraryId`: the `getUsersByLibrary` selector
could just access both locations in `state` directly.

## Features

- Dynamic, automatically-registered dependencies. Instead of listing your selector's dependencies up-front, just call
  them within your function.
- Provide arguments/parameters to selectors. Each set of arguments gets its own cache, like in re-reselect.
- Cache controls: "freeze" a selector's output even if it returned a new object.
- Call selectors recursively, if you want.

## Comparison with Reselect

(This is based on [Reselect's example selector](https://github.com/reduxjs/reselect#example).)

#### Plain, unmemoized function

State values are passed to a normal function. This is straightforward but will repeat the work every single time
your state updates.

```javascript
const getVisibleTodos = (todos, filter) => {
  // Snipped for brevity: filter `todos` by `filter`
};

const mapStateToProps = (state) => {
  return {
    todos: getVisibleTodos(state.todos, state.visibilityFilter),
  };
};
```

#### Using Reselect

Each value in state is wrapped in a function, and `getVisibleTodos` is set to depend on those functions. It will
rerun only when one of the functions returns a new value. The selector's dependencies must be listed ahead of time.

```javascript
const getVisibilityFilter = (state) => state.visibilityFilter;
const getTodos = (state) => state.todos;

const getVisibleTodos = createSelector(
  [getVisibilityFilter, getTodos],
  (visibilityFilter, todos) => {
    // Snipped for brevity: filter `todos` by `filter`
  },
);
```

#### Using Dynamic Selectors

`getVisibleTodos` can retrieve values directly from the state, or from other dynamic selectors. It will rerun only when
one of the functions returns a new value. You can retrieve values dynamically: it works with if/else, loops, etc.

```javascript
const getVisibleTodos = createDynamicSelector((getState) => {
  const visibilityFilter = getState('visibilityFilter');
  const todos = getState('todos');

  // Snipped for brevity: filter `todos` by `filter`
});
```
