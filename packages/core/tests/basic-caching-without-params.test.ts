import { createDynamicSelector } from '../src';
import DebugInfoCheckUtil from './debugInfoCheckUtil';

describe('basic caching without params', () => {
  test('get value from state', () => {
    const selector = createDynamicSelector((getState) => {
      return getState('a');
    });
    const selectorCheck = new DebugInfoCheckUtil(selector);

    let state = { a: 1 };

    // Normal run
    expect(selector(state)).toEqual(1);
    selectorCheck.expectInvoked('run');

    // Now it's cached by state
    expect(selector(state)).toEqual(1);
    selectorCheck.expectInvoked('skipped');

    state = { a: 1 };

    // Cached because the accessed state value didn't change
    expect(selector(state)).toEqual(1);
    selectorCheck.expectInvoked('skipped');

    // Now it's cached by state
    expect(selector(state)).toEqual(1);
    selectorCheck.expectInvoked('skipped');

    state = { a: 2 };

    // A full run because the accessed state value is new
    expect(selector(state)).toEqual(2);
    selectorCheck.expectInvoked('run');

    // But then it's cached again
    expect(selector(state)).toEqual(2);
    selectorCheck.expectInvoked('skipped');
  });

  test('get value from child selector', () => {
    const childSelector = createDynamicSelector((getState) => {
      return getState('a');
    });
    const childSelectorCheck = new DebugInfoCheckUtil(childSelector);

    const parentSelector = createDynamicSelector(() => {
      return childSelector();
    });
    const parentSelectorCheck = new DebugInfoCheckUtil(parentSelector);

    let state = { a: 1 };

    // Normal run
    expect(parentSelector(state)).toEqual(1);
    childSelectorCheck.expectInvoked('run');
    parentSelectorCheck.expectInvoked('run');

    // Now it's cached by state
    expect(parentSelector(state)).toEqual(1);
    childSelectorCheck.expectUntouched();
    parentSelectorCheck.expectInvoked('skipped');

    state = { a: 1 };

    // Parent invokes child, child is DepChecked, then skipped
    expect(parentSelector(state)).toEqual(1);
    childSelectorCheck.expectDepChecked('skipped');
    parentSelectorCheck.expectInvoked('skipped');

    // Cached again
    expect(parentSelector(state)).toEqual(1);
    childSelectorCheck.expectUntouched();
    parentSelectorCheck.expectInvoked('skipped');

    state = { a: 2 };

    // Parent invokes child, child is DepChecked and found to be dirty, so parent runs (and invokes child again --
    // but it's skipped now)
    expect(parentSelector(state)).toEqual(2);
    childSelectorCheck.expectDepCheckAndInvoked('run', 'skipped');
    parentSelectorCheck.expectInvoked('run');

    // Cached again
    expect(parentSelector(state)).toEqual(2);
    childSelectorCheck.expectUntouched();
    parentSelectorCheck.expectInvoked('skipped');
  });

  test('get value from multiple child selectors', () => {
    const bottomSelector = createDynamicSelector((getState) => {
      return getState('a');
    });
    const bottomSelectorCheck = new DebugInfoCheckUtil(bottomSelector);

    const middleSelector = createDynamicSelector(() => {
      return bottomSelector() + 10;
    });
    const middleSelectorCheck = new DebugInfoCheckUtil(middleSelector);

    const topSelector = createDynamicSelector(() => {
      return middleSelector();
    });
    const topSelectorCheck = new DebugInfoCheckUtil(topSelector);

    let state = { a: 1 };

    // Normal run
    expect(topSelector(state)).toEqual(11);
    bottomSelectorCheck.expectInvoked('run');
    middleSelectorCheck.expectInvoked('run');
    topSelectorCheck.expectInvoked('run');

    // Now it's cached by state
    expect(topSelector(state)).toEqual(11);
    bottomSelectorCheck.expectUntouched();
    middleSelectorCheck.expectUntouched();
    topSelectorCheck.expectInvoked('skipped');

    state = { a: 1 };

    // Top depchecks middle, middle depchecks bottom, bottom unchanged
    expect(topSelector(state)).toEqual(11);
    bottomSelectorCheck.expectDepChecked('skipped');
    middleSelectorCheck.expectDepChecked('skipped');
    topSelectorCheck.expectInvoked('skipped');

    // Cached again
    expect(topSelector(state)).toEqual(11);
    bottomSelectorCheck.expectUntouched();
    middleSelectorCheck.expectUntouched();
    topSelectorCheck.expectInvoked('skipped');

    state = { a: 2 };

    // Top depchecks middle, middle depchecks bottom, bottom found to be dirty, so middle runs (and is also dirty),
    // so parent runs -- and it then invokes middle, which is now cached from the first run.
    expect(topSelector(state)).toEqual(12);
    bottomSelectorCheck.expectDepCheckAndInvoked('run', 'skipped');
    middleSelectorCheck.expectDepCheckAndInvoked('run', 'skipped');
    topSelectorCheck.expectInvoked('run');

    // Cached again
    expect(topSelector(state)).toEqual(12);
    bottomSelectorCheck.expectUntouched();
    middleSelectorCheck.expectUntouched();
    topSelectorCheck.expectInvoked('skipped');
  });
});
