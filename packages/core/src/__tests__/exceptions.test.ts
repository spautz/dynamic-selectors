import { describe, expect, test, vitest } from 'vitest';

import { createDynamicSelector } from '../index';
import { DebugInfoCheckUtil } from '../devOnlyUtils/DebugInfoCheckUtil';

describe('exceptions', () => {
  test('throws exceptions when uncaught', () => {
    const childSelector = createDynamicSelector((getState) => {
      return getState('a');
    });
    const parentSelector = createDynamicSelector(
      (_getState, { multiplier }: { multiplier: number }) => {
        const result = childSelector() * multiplier;
        if (result % 2) {
          throw new Error('Odd number!');
        }
        return result;
      },
    );

    const childSelectorCheck = new DebugInfoCheckUtil(childSelector);
    const parentSelectorCheck10 = new DebugInfoCheckUtil(parentSelector, { multiplier: 10 });
    const parentSelectorCheck11 = new DebugInfoCheckUtil(parentSelector, { multiplier: 11 });

    const state = { a: 1 };

    expect(parentSelector(state, { multiplier: 10 })).toEqual(10);
    parentSelectorCheck10.expectInvoked('run');
    childSelectorCheck.expectInvoked('run');

    expect(() => parentSelector(state, { multiplier: 11 })).toThrowError('Odd number!');
    parentSelectorCheck11.expectInvoked('aborted');
    childSelectorCheck.expectInvoked('skipped');

    // '10' and child are still cached, '11' is not
    expect(parentSelector.hasCachedResult(state, { multiplier: 10 })).toEqual(true);
    expect(parentSelector.getCachedResult(state, { multiplier: 10 })).toEqual(10);
    expect(childSelector.hasCachedResult(state)).toEqual(true);
  });

  test('catch exception thrown by child', () => {
    const exceptionWasCaught = vitest.fn();

    const childSelector = createDynamicSelector((getState) => {
      const result = getState('a');
      if (result % 2) {
        throw new Error('Odd number!');
      }
      return result;
    });
    const parentSelector = createDynamicSelector(
      (_getState, { multiplier }: { multiplier: number }) => {
        let result = 0;
        try {
          result = childSelector() * multiplier;
        } catch (e) {
          exceptionWasCaught();
        }

        return result;
      },
    );

    let state = { a: 2 };

    expect(parentSelector(state, { multiplier: 10 })).toEqual(20);

    state = { a: 3 };

    expect(parentSelector(state, { multiplier: 10 })).toEqual(0);
    expect(exceptionWasCaught).toHaveBeenCalledTimes(1);

    // Parent is cached, child is not
    expect(parentSelector.hasCachedResult(state, { multiplier: 10 })).toEqual(true);
    expect(parentSelector.getCachedResult(state, { multiplier: 10 })).toEqual(0);
    expect(childSelector.hasCachedResult(state)).toEqual(false);
  });

  test('parent overrides exceptions with onError', () => {
    const childSelector = createDynamicSelector((getState) => {
      return getState('a');
    });
    const parentSelector = createDynamicSelector(
      (_getState, { multiplier }: { multiplier: number }) => {
        const result = childSelector() * multiplier;
        if (result % 2) {
          throw new Error('Odd number!');
        }
        return result;
      },
      {
        onError: (_error, [_state, { multiplier }]) => {
          // Silly recovery: use the multiplier as the return value
          return multiplier;
        },
      },
    );

    const childSelectorCheck = new DebugInfoCheckUtil(childSelector);
    const parentSelectorCheck10 = new DebugInfoCheckUtil(parentSelector, { multiplier: 10 });
    const parentSelectorCheck11 = new DebugInfoCheckUtil(parentSelector, { multiplier: 11 });

    const state = { a: 3 };

    expect(parentSelector(state, { multiplier: 10 })).toEqual(30);
    parentSelectorCheck10.expectInvoked('run');
    childSelectorCheck.expectInvoked('run');

    expect(parentSelector(state, { multiplier: 11 })).toEqual(11);
    parentSelectorCheck11.expectInvoked('aborted');
    childSelectorCheck.expectInvoked('skipped');

    // Since we overrode the value, everything is cached
    expect(parentSelector.hasCachedResult(state, { multiplier: 10 })).toEqual(true);
    expect(parentSelector.getCachedResult(state, { multiplier: 10 })).toEqual(30);
    expect(parentSelector.hasCachedResult(state, { multiplier: 11 })).toEqual(true);
    expect(parentSelector.getCachedResult(state, { multiplier: 11 })).toEqual(11);
    expect(childSelector.hasCachedResult(state)).toEqual(true);
  });
});
