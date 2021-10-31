import { createDynamicSelector, DynamicSelectorFn } from '../index';
import { DebugInfoCheckUtil } from '../internals/DebugInfoCheckUtil';

describe('recursion', () => {
  test('Fibonacci(3)', () => {
    const fibonacciSelector: DynamicSelectorFn = createDynamicSelector((_getState, num: number) => {
      if (num < 1) {
        return 0;
      } else if (num === 1) {
        return 1;
      }
      return fibonacciSelector(num - 1) + fibonacciSelector(num - 2);
    });

    const fibonacciSelectorCheck1 = new DebugInfoCheckUtil(fibonacciSelector, 1);
    const fibonacciSelectorCheck2 = new DebugInfoCheckUtil(fibonacciSelector, 2);
    const fibonacciSelectorCheck3 = new DebugInfoCheckUtil(fibonacciSelector, 3);

    let state = {};

    expect(fibonacciSelector(state, 3)).toEqual(2);

    fibonacciSelectorCheck3.expectInvoked('run');
    fibonacciSelectorCheck2.expectInvoked('run');
    fibonacciSelectorCheck1.expectMultiple([
      ['invoked', 'run'],
      ['invoked', 'skipped'],
    ]);
  });

  test('Fibonacci(6)', () => {
    const fibonacciSelector: DynamicSelectorFn = createDynamicSelector((_getState, num: number) => {
      if (num < 1) {
        return 0;
      } else if (num === 1) {
        return 1;
      }
      return fibonacciSelector(num - 1) + fibonacciSelector(num - 2);
    });

    const fibonacciSelectorCheck1 = new DebugInfoCheckUtil(fibonacciSelector, 1);
    const fibonacciSelectorCheck2 = new DebugInfoCheckUtil(fibonacciSelector, 2);
    const fibonacciSelectorCheck3 = new DebugInfoCheckUtil(fibonacciSelector, 3);
    const fibonacciSelectorCheck4 = new DebugInfoCheckUtil(fibonacciSelector, 4);
    const fibonacciSelectorCheck5 = new DebugInfoCheckUtil(fibonacciSelector, 5);
    const fibonacciSelectorCheck6 = new DebugInfoCheckUtil(fibonacciSelector, 6);

    let state = {};

    expect(fibonacciSelector(state, 6)).toEqual(8);

    // Because of the caching, none will be called more than twice
    fibonacciSelectorCheck6.expectInvoked('run');
    fibonacciSelectorCheck5.expectInvoked('run');
    fibonacciSelectorCheck4.expectMultiple([
      ['invoked', 'run'],
      ['invoked', 'skipped'],
    ]);
    fibonacciSelectorCheck3.expectMultiple([
      ['invoked', 'run'],
      ['invoked', 'skipped'],
    ]);
    fibonacciSelectorCheck2.expectMultiple([
      ['invoked', 'run'],
      ['invoked', 'skipped'],
    ]);
    fibonacciSelectorCheck1.expectMultiple([
      ['invoked', 'run'],
      ['invoked', 'skipped'],
    ]);
  });
});
