import { createDynamicSelector } from '../src';
import DebugInfoCheckUtil from './debugInfoCheckUtil';

describe('basic caching with params', () => {
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
});
