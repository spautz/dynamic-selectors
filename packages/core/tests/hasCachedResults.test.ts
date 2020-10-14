import { createDynamicSelector } from '../src';

describe('accessing cached results', () => {
  test('without params, from outside', () => {
    const childSelector = createDynamicSelector((getState) => {
      return getState('a');
    });
    const parentSelector = createDynamicSelector(() => {
      return childSelector() * 10;
    });

    let state = { a: 1 };

    expect(parentSelector.hasCachedResult(state)).toEqual(false);
    expect(childSelector.hasCachedResult(state)).toEqual(false);

    expect(parentSelector(state)).toEqual(10);
    expect(parentSelector.hasCachedResult(state)).toEqual(true);
    expect(parentSelector.getCachedResult(state)).toEqual(10);
    expect(childSelector.hasCachedResult(state)).toEqual(true);
    expect(childSelector.getCachedResult(state)).toEqual(1);

    state = { a: 5 };

    expect(parentSelector.hasCachedResult(state)).toEqual(false);
    expect(childSelector.hasCachedResult(state)).toEqual(false);

    expect(parentSelector(state)).toEqual(50);
    expect(parentSelector.hasCachedResult(state)).toEqual(true);
    expect(parentSelector.getCachedResult(state)).toEqual(50);
    expect(childSelector.hasCachedResult(state)).toEqual(true);
    expect(childSelector.getCachedResult(state)).toEqual(5);
  });

  test('with params, from outside', () => {
    const childSelector = createDynamicSelector((getState, params) => {
      const { path } = params;
      return getState(path);
    });
    const parentSelector = createDynamicSelector((_getState, path: string) => {
      const childValue = childSelector({ path });
      return `${path}=${childValue}`;
    });

    let state = { a: 1, b: 1 };

    expect(parentSelector.hasCachedResult(state, 'a')).toEqual(false);
    expect(parentSelector.hasCachedResult(state, 'b')).toEqual(false);
    expect(childSelector.hasCachedResult(state, { path: 'a' })).toEqual(false);
    expect(childSelector.hasCachedResult(state, { path: 'b' })).toEqual(false);

    // Normal run
    expect(parentSelector(state, 'a')).toEqual('a=1');
    expect(parentSelector.hasCachedResult(state, 'a')).toEqual(true);
    expect(parentSelector.getCachedResult(state, 'a')).toEqual('a=1');
    expect(childSelector.hasCachedResult(state, { path: 'a' })).toEqual(true);
    expect(childSelector.getCachedResult(state, { path: 'a' })).toEqual(1);

    expect(parentSelector(state, 'b')).toEqual('b=1');
    expect(parentSelector.hasCachedResult(state, 'b')).toEqual(true);
    expect(parentSelector.getCachedResult(state, 'b')).toEqual('b=1');
    expect(childSelector.hasCachedResult(state, { path: 'b' })).toEqual(true);
    expect(childSelector.getCachedResult(state, { path: 'b' })).toEqual(1);

    state = { a: 1, b: 2 };

    // 'a' is still considered cached because its accessed state didn't change
    expect(parentSelector.hasCachedResult(state, 'a')).toEqual(true);
    expect(parentSelector.getCachedResult(state, 'a')).toEqual('a=1');
    expect(parentSelector.hasCachedResult(state, 'b')).toEqual(false);
    expect(childSelector.hasCachedResult(state, { path: 'a' })).toEqual(true);
    expect(childSelector.getCachedResult(state, { path: 'a' })).toEqual(1);
    expect(childSelector.hasCachedResult(state, { path: 'b' })).toEqual(false);

    expect(parentSelector(state, 'a')).toEqual('a=1');
    expect(parentSelector.hasCachedResult(state, 'a')).toEqual(true);
    expect(parentSelector.getCachedResult(state, 'a')).toEqual('a=1');
    expect(childSelector.hasCachedResult(state, { path: 'a' })).toEqual(true);
    expect(childSelector.getCachedResult(state, { path: 'a' })).toEqual(1);

    expect(parentSelector(state, 'b')).toEqual('b=2');
    expect(parentSelector.hasCachedResult(state, 'b')).toEqual(true);
    expect(parentSelector.getCachedResult(state, 'b')).toEqual('b=2');
    expect(childSelector.hasCachedResult(state, { path: 'b' })).toEqual(true);
    expect(childSelector.getCachedResult(state, { path: 'b' })).toEqual(2);
  });

  // This is an extremely convoluted case: parentSelector's return value will depend on whether state.b has updated
  // (checked via someOtherSelector)
  test('without params, from inside', () => {
    const someOtherSelector = createDynamicSelector((getState) => {
      return getState('b');
    });
    const childSelector = createDynamicSelector((getState) => {
      return getState('a');
    });
    const parentSelector = createDynamicSelector(() => {
      if (someOtherSelector.hasCachedResult()) {
        return childSelector() * 5;
      }
      return childSelector() * 10;
    });

    let state = { a: 1, b: 2 };

    expect(parentSelector.hasCachedResult(state)).toEqual(false);
    expect(childSelector.hasCachedResult(state)).toEqual(false);
    expect(someOtherSelector.hasCachedResult(state)).toEqual(false);

    expect(parentSelector(state)).toEqual(10);
    expect(parentSelector.hasCachedResult(state)).toEqual(true);
    expect(parentSelector.getCachedResult(state)).toEqual(10);
    expect(childSelector.hasCachedResult(state)).toEqual(true);
    expect(childSelector.getCachedResult(state)).toEqual(1);

    state = { a: 5, b: 2 };

    // Running someOtherSelector changes parentSelector, but not childSelector
    expect(someOtherSelector(state)).toEqual(2);
    expect(someOtherSelector.hasCachedResult(state)).toEqual(true);
    expect(someOtherSelector.getCachedResult(state)).toEqual(2);

    expect(parentSelector(state)).toEqual(25);
    expect(parentSelector.hasCachedResult(state)).toEqual(true);
    expect(parentSelector.getCachedResult(state)).toEqual(25);
    expect(childSelector.hasCachedResult(state)).toEqual(true);
    expect(childSelector.getCachedResult(state)).toEqual(5);

    state = { a: 9, b: 2 };

    // someOtherSelector is still cached
    expect(someOtherSelector.hasCachedResult(state)).toEqual(true);
    expect(someOtherSelector.getCachedResult(state)).toEqual(2);

    expect(parentSelector(state)).toEqual(45);
    expect(parentSelector.hasCachedResult(state)).toEqual(true);
    expect(parentSelector.getCachedResult(state)).toEqual(45);
    expect(childSelector.hasCachedResult(state)).toEqual(true);
    expect(childSelector.getCachedResult(state)).toEqual(9);

    state = { a: 9, b: 50 };

    // someOtherSelector is no longer cached, and parentSelector was invalidated as well
    expect(someOtherSelector.hasCachedResult(state)).toEqual(false);
    expect(parentSelector.hasCachedResult(state)).toEqual(false);
    expect(childSelector.hasCachedResult(state)).toEqual(true);

    expect(parentSelector(state)).toEqual(90);
    expect(parentSelector.hasCachedResult(state)).toEqual(true);
    expect(parentSelector.getCachedResult(state)).toEqual(90);
    expect(childSelector.hasCachedResult(state)).toEqual(true);
    expect(childSelector.getCachedResult(state)).toEqual(9);
  });
});
