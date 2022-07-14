import { createSelector } from 'reselect';
import { describe, expect, test } from 'vitest';

import { createDynamicSelector } from '@dynamic-selectors/core';
import { DebugInfoCheckUtil } from '@dynamic-selectors/core/dist/index.devOnly';

import { reselectSelectorFromDynamic } from '../index';

type MockState = { a: number; b?: number; c?: number };

describe('reselectSelectorFromDynamic', () => {
  test('dynamic selector as a Reselect dependency', () => {
    const dynamicSelector = createDynamicSelector((getState) => {
      return getState('a');
    });
    const reselectSelector = createSelector(dynamicSelector, (depResult) => depResult);
    const selectorCheck = new DebugInfoCheckUtil(dynamicSelector);

    let state: MockState = { a: 1 };

    // Normal run
    expect(reselectSelector(state)).toEqual(1);
    selectorCheck.expectInvoked('run');
    expect(reselectSelector.recomputations()).toEqual(1);

    // Now it's cached by state
    expect(reselectSelector(state)).toEqual(1);
    selectorCheck.expectUntouched();
    expect(reselectSelector.recomputations()).toEqual(1);

    state = { a: 1 };

    // Reselect invokes dynamic, dynamic is DepChecked, then skipped
    expect(reselectSelector(state)).toEqual(1);
    selectorCheck.expectInvoked('skipped');
    expect(reselectSelector.recomputations()).toEqual(1);

    // Cached again
    expect(reselectSelector(state)).toEqual(1);
    selectorCheck.expectUntouched();
    expect(reselectSelector.recomputations()).toEqual(1);

    state = { a: 2 };

    // Reselect invokes dynamic, dynamic is found to be dirty, so it returns the new value
    expect(reselectSelector(state)).toEqual(2);
    selectorCheck.expectInvoked('run');
    expect(reselectSelector.recomputations()).toEqual(2);

    // Cached again
    expect(reselectSelector(state)).toEqual(2);
    selectorCheck.expectUntouched();
    expect(reselectSelector.recomputations()).toEqual(2);
  });

  test('dynamic selector with params as a Reselect dependency', () => {
    const dynamicSelector = createDynamicSelector((getState, path: string) => {
      return getState(path);
    });
    const reselectSelectorA = createSelector(
      [reselectSelectorFromDynamic(dynamicSelector, 'a')],
      (depResult) => depResult,
    );
    const reselectSelectorB = createSelector(
      [reselectSelectorFromDynamic(dynamicSelector, 'b')],
      (depResult) => depResult,
    );
    const reselectSelectorC = createSelector(
      [reselectSelectorFromDynamic(dynamicSelector, 'c')],
      (depResult) => depResult,
    );
    const dynamicSelectorCheckA = new DebugInfoCheckUtil(dynamicSelector, 'a');
    const dynamicSelectorCheckB = new DebugInfoCheckUtil(dynamicSelector, 'b');
    const dynamicSelectorCheckC = new DebugInfoCheckUtil(dynamicSelector, 'c');

    let state: MockState = { a: 1, b: 1, c: 1 };

    // Normal runs
    expect(reselectSelectorA(state)).toEqual(1);
    dynamicSelectorCheckA.expectInvoked('run');
    dynamicSelectorCheckB.expectUntouched();
    dynamicSelectorCheckC.expectUntouched();
    expect(reselectSelectorB(state)).toEqual(1);
    dynamicSelectorCheckA.expectUntouched();
    dynamicSelectorCheckB.expectInvoked('run');
    dynamicSelectorCheckC.expectUntouched();
    expect(reselectSelectorC(state)).toEqual(1);
    dynamicSelectorCheckA.expectUntouched();
    dynamicSelectorCheckB.expectUntouched();
    dynamicSelectorCheckC.expectInvoked('run');

    expect(reselectSelectorA.recomputations()).toEqual(1);
    expect(reselectSelectorB.recomputations()).toEqual(1);
    expect(reselectSelectorC.recomputations()).toEqual(1);

    // Now all are cached by state
    expect(reselectSelectorA(state)).toEqual(1);
    dynamicSelectorCheckA.expectUntouched();
    expect(reselectSelectorB(state)).toEqual(1);
    dynamicSelectorCheckB.expectUntouched();
    expect(reselectSelectorC(state)).toEqual(1);
    dynamicSelectorCheckC.expectUntouched();

    expect(reselectSelectorA.recomputations()).toEqual(1);
    expect(reselectSelectorB.recomputations()).toEqual(1);
    expect(reselectSelectorC.recomputations()).toEqual(1);

    state = { a: 1, b: 1, c: 2 };

    // A and B are cached because the accessed state value didn't change; C re-ran
    expect(reselectSelectorA(state)).toEqual(1);
    dynamicSelectorCheckA.expectInvoked('skipped');
    expect(reselectSelectorB(state)).toEqual(1);
    dynamicSelectorCheckB.expectInvoked('skipped');
    expect(reselectSelectorC(state)).toEqual(2);
    dynamicSelectorCheckC.expectInvoked('run');

    expect(reselectSelectorA.recomputations()).toEqual(1);
    expect(reselectSelectorB.recomputations()).toEqual(1);
    expect(reselectSelectorC.recomputations()).toEqual(2);

    // Now all are cached by state
    expect(reselectSelectorA(state)).toEqual(1);
    dynamicSelectorCheckA.expectUntouched();
    expect(reselectSelectorB(state)).toEqual(1);
    dynamicSelectorCheckB.expectUntouched();
    expect(reselectSelectorC(state)).toEqual(2);
    dynamicSelectorCheckC.expectUntouched();

    expect(reselectSelectorA.recomputations()).toEqual(1);
    expect(reselectSelectorB.recomputations()).toEqual(1);
    expect(reselectSelectorC.recomputations()).toEqual(2);

    state = { a: 2, b: 2, c: 3 };

    // Full runs because the accessed state value is new
    expect(reselectSelectorA(state)).toEqual(2);
    dynamicSelectorCheckA.expectInvoked('run');
    expect(reselectSelectorB(state)).toEqual(2);
    dynamicSelectorCheckB.expectInvoked('run');
    expect(reselectSelectorC(state)).toEqual(3);
    dynamicSelectorCheckC.expectInvoked('run');

    expect(reselectSelectorA.recomputations()).toEqual(2);
    expect(reselectSelectorB.recomputations()).toEqual(2);
    expect(reselectSelectorC.recomputations()).toEqual(3);

    // But now everything is cached again
    expect(reselectSelectorA(state)).toEqual(2);
    dynamicSelectorCheckA.expectUntouched();
    expect(reselectSelectorB(state)).toEqual(2);
    dynamicSelectorCheckB.expectUntouched();
    expect(reselectSelectorC(state)).toEqual(3);
    dynamicSelectorCheckC.expectUntouched();
  });
});
