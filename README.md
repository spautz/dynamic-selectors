# Dynamic Selectors

Selectors with parameters and dynamic dependencies.

**This package is in active development. Things will change rapidly, and it is not yet production-ready. Feedback is welcome.**

[![build status](https://img.shields.io/travis/com/spautz/dynamic-selectors/main.svg)](https://travis-ci.com/spautz/dynamic-selectors/branches)
[![test coverage](https://img.shields.io/coveralls/github/spautz/dynamic-selectors/main.svg)](https://coveralls.io/github/spautz/dynamic-selectors?branch=main)

## Packages

**[@dynamic-selectors/core](./packages/core/)**

[![npm version](https://img.shields.io/npm/v/@dynamic-selectors/core/latest.svg)](https://www.npmjs.com/package/@dynamic-selectors/core)
[![gzip size](https://img.shields.io/bundlephobia/minzip/@dynamic-selectors/core)](https://bundlephobia.com/result?p=@dynamic-selectors/core@latest)

(In progress, not published)

## What is this?

A "selector" is a memoized function to compute derived data from state. [Reselect](https://github.com/reduxjs/reselect)
is a popular selector library: their ["motivation" section](https://github.com/reduxjs/reselect#motivation-for-memoized-selectors)
explains why you might want to use selectors.

**"Dynamic selectors" look and work more like plain functions.** There is no up-front registration to connect selectors
together, you can pass arguments to them, and they work within `if` blocks and loops.

This may be used with a state library like Redux, or on its own as a general memoization util.

## Features

<dl>
  <dt>Pass arguments to selector functions</dt>
  <dd>
    Results are memoized by the params you pass to a selector, so <code>selectBooks({ authorId: 3 })</code> and
    <code>selectBooks({ authorId: 4 })</code> will work properly and be cached independently.
  </dd>

  <dt>Auto-detected dependencies</dt>
  <dd>
    When a selector runs, any secondary selectors it calls get marked as dependencies. It won't re-run unless those
    dependencies return something new. The dependencies can change from one run to the next.
  </dd>

  <dt>Equality comparisons</dt>
  <dd>
    Like the [`useSelector` hook](https://react-redux.js.org/api/hooks#equality-comparisons-and-updates), you can
    specify your own comparison function to 'freeze' updates. This may be set per-selector.
  </dd>

  <dt>Compatible with Reselect and Re-reselect</dt>
  <dd>
    You can call other libraries' selectors from within dynamic selectors, and dynamic selectors can be used as
    dependencies with other libraries. (<code>@TODO</code>. This will be the `@dynamic-selectors/with-reselect` package.)
  </dd>
</dl>
