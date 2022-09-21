# Dynamic Selectors

Selectors with parameters and dynamic dependencies.

See **[Selector Comparison](https://github.com/spautz/dynamic-selectors/blob/main/packages/core/docs/comparison-with-reselect.md)** for a walkthrough.

[![build status](https://github.com/spautz/dynamic-selectors/workflows/CI/badge.svg)](https://github.com/spautz/dynamic-selectors/actions)
[![test coverage](https://img.shields.io/coveralls/github/spautz/dynamic-selectors/main.svg)](https://coveralls.io/github/spautz/dynamic-selectors?branch=main)

## Packages

#### [@dynamic-selectors/core](./packages/core/)

[![npm version](https://img.shields.io/npm/v/@dynamic-selectors/core.svg)](https://www.npmjs.com/package/@dynamic-selectors/core)
[![test coverage](https://coveralls.io/repos/github/spautz/dynamic-selectors/badge.svg?branch=x-cov-core)](https://coveralls.io/github/spautz/dynamic-selectors?branch=x-cov-core)
[![dependencies status](https://img.shields.io/librariesio/release/npm/@dynamic-selectors/core.svg)](https://libraries.io/github/spautz/dynamic-selectors)
[![gzip size](https://img.badgesize.io/https://unpkg.com/@dynamic-selectors/core@latest/dist/index.cjs?compression=gzip)](https://bundlephobia.com/result?p=@dynamic-selectors/core)

Core functionality for dynamic selectors, independent of any other library.<br/>
This is the main package.

#### [@dynamic-selectors/with-reselect](./packages/with-reselect/)

[![npm version](https://img.shields.io/npm/v/@dynamic-selectors/with-reselect.svg)](https://www.npmjs.com/package/@dynamic-selectors/with-reselect)
[![test coverage](https://coveralls.io/repos/github/spautz/dynamic-selectors/badge.svg?branch=x-cov-with-reselect)](https://coveralls.io/github/spautz/dynamic-selectors?branch=x-cov-with-reselect)
[![dependencies status](https://img.shields.io/librariesio/release/npm/@dynamic-selectors/with-reselect.svg)](https://libraries.io/github/spautz/dynamic-selectors)
[![gzip size](https://img.badgesize.io/https://unpkg.com/@dynamic-selectors/with-reselect@latest/dist/index.cjs?compression=gzip)](https://bundlephobia.com/result?p=@dynamic-selectors/with-reselect)

Call Reselect selectors from within dynamic selectors, and use dynamic selectors as dependencies for Reselect selectors.

## What is this?

Selectors are memoized functions that transform data -- like computing a derived value from state -- which only re-run
when their dependencies change. [Reselect](https://github.com/reduxjs/reselect) is a popular selector library:
Redux's [Deriving Data with Selectors](https://redux.js.org/usage/deriving-data-selectors) doc is a good introduction
to them.

_Dynamic selectors are built like plain functions._ There is no up-front registration to connect selectors
together, you can pass arguments to them, and they can call each other just like regular functions.

This may be used with a state library like Redux, or on its own as a general memoization util.

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
