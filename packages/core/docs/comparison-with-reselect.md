# Selector comparison

This shows several different ways to write a simple selector that filters a list of books (`state.books`) based on
a author (`state.authorFilter`).

## 1. Plain, unmemoized function

The simplest implementation is to use no selector at all. This is straightforward to write, but it will repeat the work
every time your state updates -- and because array's `filter()` returns a new array every time it runs, this will always
trigger a rerender.

```javascript
const getBooksForAuthor = (books, authorFilter) => {
  return books.filter((book) => book.author === authorFilter);
};

useSelector((state) => getBooksForAuthor(state.books, state.authorFilter));
```

## 2. Reselect selectors

Reselect offers a standard way to memoize the operation, building up a dependency tree of functions.

Each state value is wrapped in an accessor function, and `getBooksForAuthor` is set to depend on those functions.
It will rerun only when one of the functions returns a new value. The selector's dependencies must be registered at
creation time.

```javascript
const getBooks = (state) => state.books;
const getAuthorFilter = (state) => state.authorFilter;

const getBooksForAuthor = createSelector([getBooks, getAuthorFilter], (books, authorFilter) => {
  return books.filter((book) => book.author === authorFilter);
});
```

## 3. Dynamic Selector

`getBooksForAuthor` can retrieve values directly from the state, or from other dynamic selectors. It will rerun only
when
one of the functions returns a new value. For simple cases, this ultimately works the same as a Reselect selector --
just with less code and fewer functions.

```javascript
const getBooksForAuthor = createDynamicSelector((getState) => {
  const books = getState('books');
  const authorFilter = getState('authorFilter');

  return books.filter((book) => book.author === authorFilter);
});
```

### More complex cases

#### Conditional dependency

With a dynamic selector you can retrieve values dynamically, change the `getState` calls from run to run, and generally
be flexible in ways that upfront selector registration doesn't allow.

Here's an example which allows the author to be overridden by the caller. Results are memoized independently by params,
so this will remain cached even when `state.authorFilter` changes: `state.authorFilter` only gets marked as a
dependency if it's actually used.

```javascript
const getBooksForAuthor = createDynamicSelector((getState, authorFilterOverride) => {
  const books = getState('books');
  const authorFilter = authorFilterOverride || getState('authorFilter');

  return books.filter((book) => book.author === authorFilter);
});
```

#### Loops

You can build higher-level selectors on top of simpler selectors, without having to rewrite any accessors or other
logic.

In this example, `authorFilter` can be a single author or a list of authors. The caching all works as before, so
if one of the authors in the list already has a list of books cached, it will not be reprocessed.

```javascript
const getBooksForAuthor = createDynamicSelector((getState, authorFilterOverride) => {
  const books = getState('books');
  const authorFilter = authorFilterOverride || getState('authorFilter');

  if (Array.isArray(authorFilter)) {
    // Accumulate books for each author, and combine them into a list of lists
    return authorFilter.map(
      // Recurse!
      (authorFilter) => getBooksForAuthor(authorFilter),
    );
  } else {
    return books.filter((book) => book.author === authorFilter);
  }
});
```

The above solution is `O(n^2)` for a large number of authors: in practice you probably don't want to loop over
the `books` multiple times.

With traditional selectors, refactoring this to loop over `books` only once would require rewriting the entire selector.
Instead, you could split the algorithm inside the selector: use `getBooksForAuthor` as before if the list is small,
or for any authors who already have a cached result (see the [API docs](../README.md#additional-selector-properties)
for `.hasCachedResult()`), and then process the remainder in a single loop.
