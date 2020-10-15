import { createDynamicSelector } from '../src';
import DebugInfoCheckUtil from './util/debugInfoCheckUtil';

describe('freeze result', () => {
  test('sorted array', () => {
    const sortedArraySelector = createDynamicSelector((getState) => {
      const rawArray = getState('list');
      return [...rawArray].sort((a, b) => a - b);
    });
    const checkSortedArraySelector = new DebugInfoCheckUtil(sortedArraySelector);

    let state = { list: [1, 4, 7, 3, 2, 6, 9, 8, 5] };

    const firstResult = sortedArraySelector(state);
    expect(firstResult).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    checkSortedArraySelector.expectInvoked('run');
  });
});
