# Selector comparison

This shows several different ways to write a simple selector that filters a list of books (`state.books`) based on
an author (`state.authorFilter`).

## 1. Plain, unmemoized function

The simplest implementation is to use no selector at all. This is straightforward to write, but it will repeat the work
every time your state updates -- and because array's `filter()` returns a new array every time it runs, this will always
trigger a rerender. Performance will often be poor as a result.

```javascript
const getBooksForAuthor = (state) => {
  const { books, authorFilter } = state;
  return books.filter((book) => book.author === authorFilter);
};

// You would then call it from within your component:
useSelector(getBooksForAuthor);
```

## 2. Reselect selectors

Reselect offers a standard way to memoize the operation, by manually building a dependency tree of selectors.

Each state value is wrapped in an accessor function, and `getBooksForAuthor` depends on those functions: it will rerun
when one of them returns a new value. The selector's dependencies must be registered at creation time.

```javascript
const getBooks = (state) => state.books;
const getAuthorFilter = (state) => state.authorFilter;

const getBooksForAuthor = createSelector([getBooks, getAuthorFilter], (books, authorFilter) => {
  return books.filter((book) => book.author === authorFilter);
});

// You would then call it from within your component:
useSelector(getBooksForAuthor);
```

## 3. Dynamic selector

Dynamic-Selectors creates a memoized selector with dependencies on other selectors, just like Reselect.
Like a Reselect selector, it will only rerun when one of its dependencies returns a new value.

The `getState` helper can access deep paths in the state, so you don't need to create separate accessor functions.
Dependencies are registered automatically as the function runs: you do not register them upfront.

```javascript
const getBooksForAuthor = createDynamicSelector((getState) => {
  const books = getState('books');
  const authorFilter = getState('authorFilter');

  return books.filter((book) => book.author === authorFilter);
});

// You would then call it from within your component:
useSelector(getBooksForAuthor);
```

## Additional Features

### Conditional dependencies

With a dynamic selector you can call dependencies dynamically, change the `getState` paths from run to run, and
generally be flexible in ways that upfront selector registration doesn't allow.

In this example, books are stored by authorId in the state: `state.booksByAuthor[3]` has the list of books for
`authorId=3`. We _only_ retrieve books if `state.currentAuthor` is set: there is no dependency on `state.booksByAuthor`
otherwise.

Because `booksByAuthor[currentAuthor]` only gets marked as a dependency when it's actually used, this will only rerun
when either the author changes, or the list of books for that author changes.

```javascript
const getBooksForAuthor = createDynamicSelector((getState) => {
  const currentAuthor = getState('currentAuthor');
  if (!currentAuthor) {
    return [];
  }

  return getState(['booksByAuthor', currentAuthor]);
});
```

### Selector parameters

Selectors can be passed arguments, just like any other function. Unlike Reselect -- where _all_ selectors in the tree
receive the arguments passed to the initial selector (["createSelector behavior"](https://redux.js.org/usage/deriving-data-selectors#createselector-behavior)
-- each call to a Dynamic Selector may be given its own arguments, just like a regular function call.

This example receives `currentAuthor` as an argument, instead of looking it up in the state.

Results are memoized independently by params, so the results for `getBooksForAuthor(state, 1)` will remain cached even
if `getBooksForAuthor(state, 2)` is called. The size and behavior of this cache can be controlled with the
[getKeyForParams](https://github.com/spautz/dynamic-selectors/tree/main/packages/core#getkeyforparams-functionparams-default-jsonstringify)
and
[createResultCache](https://github.com/spautz/dynamic-selectors/tree/main/packages/core#createresultcache-function-default-plain-object)
options.

```javascript
const getBooksForAuthor = createDynamicSelector((getState, authorId) => {
  if (!authorId) {
    return [];
  }

  return getState(['booksByAuthor', authorId]);
});
```

### Loops

You can build higher-level selectors on top of simpler selectors, without having to rewrite any accessors or other
logic.

In this example, the state stores a list of bookIds (rather than a list of book objects as above), with the data on each
book stored under a different key (`state.bookInfo`), so an additional lookup is necessary.

```javascript
const getBooksForAuthor = createDynamicSelector((getState, authorId) => {
  const bookIds = getState(['booksByAuthor', authorId]);
  return bookIds.map((bookId) => getState(['bookInfo', bookId]));
});
```

This can be particularly useful if an additional constructor call is necessary to get each book's data in the desired
format: that can be moved into its own selector, which will then be memoized by `bookId` -- and the cache will be shared
among all callers.

This specific case is difficult to optimize using Reselect selectors, because the dependencies of one selector will
depend on the _output_ of another selector (the list of bookIds for an authorId, in this example.)

```javascript
// Each `getBookInfo` result is memoized by the `bookId` argument
const getBookInfo = createDynamicSelector((getState, bookId) => {
  const rawBookData = getState(`bookInfo[${bookId}]`);
  return new Book(rawBookData);
});

// This will be memoized by the specific books for the authorId given: other changes in `booksByAuthor` will not trigger
// a rerun
const getBooksForAuthor = createDynamicSelector((getState, authorId) => {
  const bookIds = getState(['booksByAuthor', authorId]);
  return bookIds.map((bookId) => getBookInfo(bookId));
});
```

### Recursion

Because each dynamic selector is memoized by its arguments, you can call the same selector recursively to build up
complex cases.

In this example, a set of search results is filtered by using the _prior_ set of search results: a search for "Steven"
will search over the results of "Steve" (which is filtered from the results of "Stev"), instead of searching over the
entire list of books.

```javascript
const minimumQueryLength = 2;

const searchBookTitle = (getState, query) => {
  if (!query || query.length < minimumQueryLength) {
    // Base case: return entire list of books
    return getState('books');
  }

  // When searching, use the search results from the previous, shorter query
  // (Recurse!)
  const allBooks = searchBookTitle(query.substring(0, query.length - 1));

  return allBooks.filter((bookInfo) => bookInfo.title.indexOf(query) !== -1);
};
```
