# Comparison with Reselect

This shows several different ways to write [Reselect's example selector](https://github.com/reduxjs/reselect#example),
which -- assuming Redux -- filters `state.todos` based on a value in `state.visibilityFilter`.

#### Plain, unmemoized function

State values are passed to a normal function. This is straightforward to write, but it will repeat the work every
single time your state updates, with potentially bad performance.

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
