# Changelog

## 1.2.1

### Patch Changes

- Add declarationMap to build ([#48](https://github.com/spautz/dynamic-selectors/issues/48)) ([d067579](https://github.com/spautz/dynamic-selectors/commit/d0675791ce3c2278e8bdb3573500aab981527fab))

## 1.2.0 (2023-04-30)

### Minor Changes

- Add NPM provenance via Github actions ([83ff1ee](https://github.com/spautz/dynamic-selectors/commit/83ff1eefa9cd056fc8b8a317e3cac805507c101c))
- Confirm support for Node 20 ([83ff1ee](https://github.com/spautz/dynamic-selectors/commit/83ff1eefa9cd056fc8b8a317e3cac805507c101c))
- Update dependencies and devDependencies ([83ff1ee](https://github.com/spautz/dynamic-selectors/commit/83ff1eefa9cd056fc8b8a317e3cac805507c101c))

## [1.1.1](https://github.com/spautz/dynamic-selectors/compare/v1.1.0...v1.1.1) (2022-09-18)

- Add esm-related fixes that were supposed to be in v1.1.0 ([#41](https://github.com/spautz/dynamic-selectors/issues/41)) ([f598f24](https://github.com/spautz/dynamic-selectors/commit/f598f2469cb04aa1ca748d87292b39c10e5e7237))

## [1.1.0](https://github.com/spautz/dynamic-selectors/compare/v1.0.0...v1.1.0) (2022-09-18)

All docs have been updated for clarity and accuracy.

- Improve bundle size and add size-limit checks to build ([#40](https://github.com/spautz/dynamic-selectors/issues/40)) ([7ec596c](https://github.com/spautz/dynamic-selectors/commit/7ec596ca8a67e53db3e7074189a7731bce7ab501))
- Use core lodash get for default state accessor, instead of a standalone package ([#39](https://github.com/spautz/dynamic-selectors/issues/39)) ([e16ae4f](https://github.com/spautz/dynamic-selectors/commit/e16ae4f87a47b01a619e012dbd59456e9156ac5c))

## [1.0.0](https://github.com/spautz/dynamic-selectors/compare/v0.4.0...v1.0.0) (2022-09-12)

Typescript typings for Dynamic-Selectors have been rewritten from the ground up: the typings for a dynamic selector are
now inferred from the typings of the internal function you pass to `createDynamicSelector`. This includes the return
type, any key params, and any extra args.

- The `getState` argument passed to a selector now accepts a generic param for its return value.
- Default typings are more restrictive, and will result in `unknown` being returned if not inferrable or specified.
- `dynamicSelectorForState` now accepts a generic type param for the State, which affects its own options and the
  typings for the `createDynamicSelector` function it returns.

Aside from these typing changes, there are no changes to the overall algorithm or functionality: everything should work
the same now as before.

- Selector parameter and return-type typings are now inferred based on the function you
  provide ([#37](https://github.com/spautz/dynamic-selectors/issues/37)) ([c36ba19](https://github.com/spautz/dynamic-selectors/commit/c36ba19bfd964a05c6e6847184e6e1ec19eabc81))
- Update build system and supported Node
  versions ([#35](https://github.com/spautz/dynamic-selectors/issues/35)) ([42dfbc2](https://github.com/spautz/dynamic-selectors/commit/42dfbc2a7a856aaf82d400e08220d3f09c7c38b0))
- Clean up
  docs ([#36](https://github.com/spautz/dynamic-selectors/issues/36)) ([1a1ffe4](https://github.com/spautz/dynamic-selectors/commit/1a1ffe40c8e8efd672e3d11c2a4115dc3a1541e0))

## [0.4.0](https://github.com/spautz/dynamic-selectors/compare/v0.3.1...v0.4.0) (2021-11-03)

- Confirm support for Node
  17 ([#24](https://github.com/spautz/dynamic-selectors/issues/24)) ([cc80c38](https://github.com/spautz/dynamic-selectors/commit/cc80c38afc70b42f5715a03e78507eba7aeb7b8f))
- Internal package
  updates ([#25](https://github.com/spautz/dynamic-selectors/issues/25)) ([aaca930](https://github.com/spautz/dynamic-selectors/commit/aaca93092391991deb4f630707d2ac3583c85a59))

## [0.3.0](https://github.com/spautz/dynamic-selectors/compare/v0.2.1...v0.3.0) (2021-05-29)

### Features

- Publish multiple typesVersions for different versions of
  Typescript ([#19](https://github.com/spautz/dynamic-selectors/issues/19)) ([5eb08ab](https://github.com/spautz/dynamic-selectors/commit/5eb08ab8d8c151d592aa90b59737f8f1060b74b6))

### [0.2.2](https://github.com/spautz/dynamic-selectors/compare/v0.2.1...v0.2.2) (2021-02-20)

Update dependencies and peerDependencies. No functional changes.

## [0.2.1](https://github.com/spautz/dynamic-selectors/compare/v0.1.0...v0.2.1) (2020-10-30)

### Features

- Emit a warning if invalid options are passed in (dev
  only) ([#6](https://github.com/spautz/dynamic-selectors/issues/6)) ([66d3b48](https://github.com/spautz/dynamic-selectors/commit/66d3b4859679262f198ea2d4ceee49201e7996fd))

### [0.1.1](https://github.com/spautz/dynamic-selectors/compare/v0.1.0...v0.1.1) (2020-10-18)

- Improve documentation

### Features

- Cleanup and validate options (dev
  only) ([#6](https://github.com/spautz/dynamic-selectors/issues/6)) ([66d3b48](https://github.com/spautz/dynamic-selectors/commit/66d3b4859679262f198ea2d4ceee49201e7996fd))

## [0.1.0](https://github.com/spautz/dynamic-selectors/compare/v0.0.3...v0.1.0) (2020-10-15)

### Features

- Add read-only dependencies as first-class
  dependencies ([#3](https://github.com/spautz/dynamic-selectors/issues/3)) ([7963789](https://github.com/spautz/dynamic-selectors/commit/796378969f0384eafa31a775ce63c02cfbabbb07))
- Add resetCache, with more
  tests ([#4](https://github.com/spautz/dynamic-selectors/issues/4)) ([f39492d](https://github.com/spautz/dynamic-selectors/commit/f39492d5f7fc271fcac99ff6c55ae38357597e15))

### [0.0.3](https://github.com/spautz/dynamic-selectors/compare/v0.0.2...v0.0.3) (2020-10-14)

### Bug Fixes

- Bugfix for readonly runs, with test
  coverage ([#2](https://github.com/spautz/dynamic-selectors/issues/2)) ([954cf6b](https://github.com/spautz/dynamic-selectors/commit/954cf6b997a8b09a97fc63cf24e1a29e09516e0d))

### 0.0.2 (2020-10-12)

Initial prototype
