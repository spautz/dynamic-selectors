import { createSelector } from 'reselect';

import { dynamicSelectorFromReselect } from '../src';
import DebugInfoCheckUtil from '../../core/tests/util/debugInfoCheckUtil';

describe('dynamicSelectorFromReselect', () => {
  test('handles simple selector functions', () => {
    const reselectSelector = (state: any) => state.a;
    const dynamicSelector = dynamicSelectorFromReselect(reselectSelector);
    const selectorCheck = new DebugInfoCheckUtil(dynamicSelector);

    let state = { a: 1 };

    // Normal run
    expect(dynamicSelector(state)).toEqual(1);
    selectorCheck.expectInvoked('run');

    // Now it's cached by state
    expect(dynamicSelector(state)).toEqual(1);
    selectorCheck.expectInvoked('skipped');

    state = { a: 1 };

    // It's a new state, so Reselect returns a new value, but after we run we realize we didn't need to
    expect(dynamicSelector(state)).toEqual(1);
    selectorCheck.expectInvoked('phantom');

    // Now it's cached by state
    expect(dynamicSelector(state)).toEqual(1);
    selectorCheck.expectInvoked('skipped');

    state = { a: 2 };

    // A full run because the accessed state value is new
    expect(dynamicSelector(state)).toEqual(2);
    selectorCheck.expectInvoked('run');

    // But then it's cached again
    expect(dynamicSelector(state)).toEqual(2);
    selectorCheck.expectInvoked('skipped');
  });

  test('handles normal selector functions', () => {
    const reselectorDependency = (state: any) => state.a;
    const reselectSelector = createSelector(reselectorDependency, (depResult) => depResult);
    const dynamicSelector = dynamicSelectorFromReselect(reselectSelector);

    const selectorCheck = new DebugInfoCheckUtil(dynamicSelector);

    let state = { a: 1 };

    // Normal run
    expect(dynamicSelector(state)).toEqual(1);
    selectorCheck.expectInvoked('run');

    // Now it's cached by state
    expect(dynamicSelector(state)).toEqual(1);
    selectorCheck.expectInvoked('skipped');

    state = { a: 1 };

    // It's a new state, so Reselect returns a new value, but after we run we realize we didn't need to
    expect(dynamicSelector(state)).toEqual(1);
    selectorCheck.expectInvoked('phantom');

    // Cached again
    expect(dynamicSelector(state)).toEqual(1);
    selectorCheck.expectInvoked('skipped');

    state = { a: 2 };

    // Parent invokes child, child is DepChecked and found to be dirty, so parent runs (and invokes child again --
    // but it's skipped now)
    expect(dynamicSelector(state)).toEqual(2);
    selectorCheck.expectInvoked('run');

    // Cached again
    expect(dynamicSelector(state)).toEqual(2);
    selectorCheck.expectInvoked('skipped');
  });
});
