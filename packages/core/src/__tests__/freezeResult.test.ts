import { describe, expect, test } from 'vitest';

import { createDynamicSelector } from '../index';
import { DebugInfoCheckUtil } from '../devOnlyUtils/DebugInfoCheckUtil';

type MockState = { list?: Array<number> };

describe('freeze result', () => {
  test('sorted array', () => {
    const sortedArraySelector = createDynamicSelector((getState) => {
      const rawArray = getState<Array<number>>('list');
      return [...rawArray].sort((a, b) => a - b);
    });
    const checkSortedArraySelector = new DebugInfoCheckUtil(sortedArraySelector);

    let state: MockState = { list: [1, 4, 7, 3, 2, 6, 9, 8, 5] };

    const result1 = sortedArraySelector(state);
    expect(result1).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    checkSortedArraySelector.expectInvoked('run');

    // Same state, really, but this will cause a rerun
    state = { list: [1, 4, 7, 3, 2, 6, 9, 8, 5] };

    const result2 = sortedArraySelector(state);
    expect(result2).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(result2).toStrictEqual(result1);
    checkSortedArraySelector.expectInvoked('phantom');

    // Once more, with a genuinely different input
    state = { list: [6, 9, 1, 4, 7, 3, 8, 5, 2] };

    const result3 = sortedArraySelector(state);
    expect(result3).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(result3).toStrictEqual(result1);
    checkSortedArraySelector.expectInvoked('phantom');
  });

  test('recovery after exception', () => {
    const sortedArraySelector = createDynamicSelector(
      (getState) => {
        const rawArray = getState<Array<number>>('list');
        return [...rawArray].sort((a, b) => a - b);
      },
      {
        onError: () => [],
      },
    );
    const checkSortedArraySelector = new DebugInfoCheckUtil(sortedArraySelector);

    let state: MockState = { list: [] };

    const result1 = sortedArraySelector(state);
    expect(result1).toEqual([]);
    checkSortedArraySelector.expectInvoked('run');

    // Oops, we can't sort a nonexistent value
    state = {};

    // But it's ok: onError recovers with an empty array, which is still detected as a phantom run
    const result2 = sortedArraySelector(state);
    expect(result2).toEqual([]);
    expect(result2).toStrictEqual(result1);
    checkSortedArraySelector.expectInvoked('aborted');
  });
});
