import { describe, expect, test } from 'vitest';

import { createDynamicSelector } from '../index';
import { DebugInfoCheckUtil } from './DebugInfoCheckUtil';

describe('basic params', () => {
  test('params exist', () => {
    const selector = createDynamicSelector((getState, path?: string) => {
      return getState(path || null);
    });

    const state = { a: 1, b: 2, c: 3 };

    expect(selector(state)).toEqual({ a: 1, b: 2, c: 3 });

    expect(selector.hasCachedResult(state, 'a')).toEqual(false);
    expect(selector.hasCachedResult(state, 'b')).toEqual(false);
    expect(selector.hasCachedResult(state, 'c')).toEqual(false);
    expect(selector.hasCachedResult(state, 'd')).toEqual(false);
    expect(selector.hasCachedResult(state)).toEqual(true);

    expect(selector(state, 'a')).toEqual(1);
    expect(selector(state, 'b')).toEqual(2);
    expect(selector(state, 'c')).toEqual(3);

    expect(selector.hasCachedResult(state, 'a')).toEqual(true);
    expect(selector.hasCachedResult(state, 'b')).toEqual(true);
    expect(selector.hasCachedResult(state, 'c')).toEqual(true);
    expect(selector.hasCachedResult(state, 'd')).toEqual(false);
    expect(selector.hasCachedResult(state)).toEqual(true);

    expect(selector.getCachedResult(state, 'a')).toEqual(1);
    expect(selector.getCachedResult(state, 'b')).toEqual(2);
    expect(selector.getCachedResult(state, 'c')).toEqual(3);
    expect(selector.getCachedResult(state, 'd')).toEqual(undefined);
    expect(selector.getCachedResult(state)).toEqual({ a: 1, b: 2, c: 3 });
  });

  test('get value from state with params', () => {
    const selector = createDynamicSelector((getState, path: string) => {
      return getState(path);
    });
    const selectorCheckA = new DebugInfoCheckUtil(selector, 'a');
    const selectorCheckB = new DebugInfoCheckUtil(selector, 'b');
    const selectorCheckC = new DebugInfoCheckUtil(selector, 'c');

    let state = { a: 1, b: 1, c: 1 };

    // Normal run
    expect(selector(state, 'a')).toEqual(1);
    selectorCheckA.expectInvoked('run');
    selectorCheckB.expectUntouched();
    selectorCheckC.expectUntouched();
    expect(selector(state, 'b')).toEqual(1);
    selectorCheckA.expectUntouched();
    selectorCheckB.expectInvoked('run');
    selectorCheckC.expectUntouched();
    expect(selector(state, 'c')).toEqual(1);
    selectorCheckA.expectUntouched();
    selectorCheckB.expectUntouched();
    selectorCheckC.expectInvoked('run');

    // Now all are cached by state
    expect(selector(state, 'a')).toEqual(1);
    selectorCheckA.expectInvoked('skipped');
    expect(selector(state, 'b')).toEqual(1);
    selectorCheckB.expectInvoked('skipped');
    expect(selector(state, 'c')).toEqual(1);
    selectorCheckC.expectInvoked('skipped');

    state = { a: 1, b: 1, c: 2 };

    // A and B are cached because the accessed state value didn't change; C re-ran
    expect(selector(state, 'a')).toEqual(1);
    selectorCheckA.expectInvoked('skipped');
    expect(selector(state, 'b')).toEqual(1);
    selectorCheckB.expectInvoked('skipped');
    expect(selector(state, 'c')).toEqual(2);
    selectorCheckC.expectInvoked('run');

    // Now all are cached by state
    expect(selector(state, 'a')).toEqual(1);
    selectorCheckA.expectInvoked('skipped');
    expect(selector(state, 'b')).toEqual(1);
    selectorCheckB.expectInvoked('skipped');
    expect(selector(state, 'c')).toEqual(2);
    selectorCheckC.expectInvoked('skipped');

    state = { a: 2, b: 2, c: 3 };

    // Full runs because the accessed state value is new
    expect(selector(state, 'a')).toEqual(2);
    selectorCheckA.expectInvoked('run');
    expect(selector(state, 'b')).toEqual(2);
    selectorCheckB.expectInvoked('run');
    expect(selector(state, 'c')).toEqual(3);
    selectorCheckC.expectInvoked('run');

    // But now everything is cached again
    expect(selector(state, 'a')).toEqual(2);
    selectorCheckA.expectInvoked('skipped');
    expect(selector(state, 'b')).toEqual(2);
    selectorCheckB.expectInvoked('skipped');
    expect(selector(state, 'c')).toEqual(3);
    selectorCheckC.expectInvoked('skipped');
  });

  test('get value from child selector', () => {
    const childSelector = createDynamicSelector((getState, params) => {
      const { path } = params;
      return getState(path);
    });
    const parentSelector = createDynamicSelector((_getState, path: string) => {
      return childSelector({ path });
    });

    const childSelectorCheckA = new DebugInfoCheckUtil(childSelector, { path: 'a' });
    const childSelectorCheckB = new DebugInfoCheckUtil(childSelector, { path: 'b' });
    const childSelectorCheckC = new DebugInfoCheckUtil(childSelector, { path: 'c' });
    const parentSelectorCheckA = new DebugInfoCheckUtil(parentSelector, 'a');
    const parentSelectorCheckB = new DebugInfoCheckUtil(parentSelector, 'b');
    const parentSelectorCheckC = new DebugInfoCheckUtil(parentSelector, 'c');

    let state = { a: 1, b: 1, c: 1 };

    // Normal run
    expect(parentSelector(state, 'a')).toEqual(1);
    childSelectorCheckA.expectInvoked('run');
    parentSelectorCheckA.expectInvoked('run');
    childSelectorCheckB.expectUntouched();
    parentSelectorCheckB.expectUntouched();
    childSelectorCheckC.expectUntouched();
    parentSelectorCheckC.expectUntouched();
    expect(parentSelector(state, 'b')).toEqual(1);
    childSelectorCheckA.expectUntouched();
    parentSelectorCheckA.expectUntouched();
    childSelectorCheckB.expectInvoked('run');
    parentSelectorCheckB.expectInvoked('run');
    childSelectorCheckC.expectUntouched();
    parentSelectorCheckC.expectUntouched();
    expect(parentSelector(state, 'c')).toEqual(1);
    childSelectorCheckA.expectUntouched();
    parentSelectorCheckA.expectUntouched();
    childSelectorCheckB.expectUntouched();
    parentSelectorCheckB.expectUntouched();
    childSelectorCheckC.expectInvoked('run');
    parentSelectorCheckC.expectInvoked('run');

    // Now it's cached by state
    expect(parentSelector(state, 'a')).toEqual(1);
    childSelectorCheckA.expectUntouched();
    parentSelectorCheckA.expectInvoked('skipped');
    expect(parentSelector(state, 'b')).toEqual(1);
    childSelectorCheckB.expectUntouched();
    parentSelectorCheckB.expectInvoked('skipped');
    expect(parentSelector(state, 'c')).toEqual(1);
    childSelectorCheckC.expectUntouched();
    parentSelectorCheckC.expectInvoked('skipped');

    state = { a: 1, b: 1, c: 2 };

    // A and B are cached because the accessed state value didn't change
    // Parent invokes child, child is DepChecked, then skipped
    expect(parentSelector(state, 'a')).toEqual(1);
    childSelectorCheckA.expectDepChecked('skipped');
    parentSelectorCheckA.expectInvoked('skipped');
    expect(parentSelector(state, 'b')).toEqual(1);
    childSelectorCheckB.expectDepChecked('skipped');
    parentSelectorCheckB.expectInvoked('skipped');
    // C reran: first it depChecked its child (and got a dirty result), then it reran (and ran child again, now cached)
    expect(parentSelector(state, 'c')).toEqual(2);
    childSelectorCheckC.expectMultiple([
      ['depCheck', 'run'],
      ['invoked', 'skipped'],
    ]);
    parentSelectorCheckC.expectInvoked('run');

    // Cached again
    expect(parentSelector(state, 'a')).toEqual(1);
    childSelectorCheckA.expectUntouched();
    parentSelectorCheckA.expectInvoked('skipped');
    expect(parentSelector(state, 'b')).toEqual(1);
    childSelectorCheckB.expectUntouched();
    parentSelectorCheckB.expectInvoked('skipped');
    expect(parentSelector(state, 'c')).toEqual(2);
    childSelectorCheckC.expectUntouched();
    parentSelectorCheckC.expectInvoked('skipped');

    state = { a: 2, b: 2, c: 3 };

    // Full runs because the accessed state value is new
    // (Child selectors are checked, then run when parent runs)
    expect(parentSelector(state, 'a')).toEqual(2);
    childSelectorCheckA.expectMultiple([
      ['depCheck', 'run'],
      ['invoked', 'skipped'],
    ]);
    parentSelectorCheckA.expectInvoked('run');
    expect(parentSelector(state, 'b')).toEqual(2);
    childSelectorCheckB.expectMultiple([
      ['depCheck', 'run'],
      ['invoked', 'skipped'],
    ]);
    parentSelectorCheckB.expectInvoked('run');
    expect(parentSelector(state, 'c')).toEqual(3);
    childSelectorCheckC.expectMultiple([
      ['depCheck', 'run'],
      ['invoked', 'skipped'],
    ]);
    parentSelectorCheckC.expectInvoked('run');

    // Cached again
    expect(parentSelector(state, 'a')).toEqual(2);
    childSelectorCheckA.expectUntouched();
    parentSelectorCheckA.expectInvoked('skipped');
    expect(parentSelector(state, 'b')).toEqual(2);
    childSelectorCheckB.expectUntouched();
    parentSelectorCheckB.expectInvoked('skipped');
    expect(parentSelector(state, 'c')).toEqual(3);
    childSelectorCheckC.expectUntouched();
    parentSelectorCheckC.expectInvoked('skipped');
  });
});
