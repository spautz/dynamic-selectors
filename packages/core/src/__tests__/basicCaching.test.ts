import { describe, expect, test } from 'vitest';

import { createDynamicSelector } from '../index';
import { DebugInfoCheckUtil } from './DebugInfoCheckUtil';

describe('basic caching', () => {
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
    const childSelector = createDynamicSelector(
      (getState) => {
        return getState('a');
      },
      { displayName: 'child' },
    );
    const parentSelector = createDynamicSelector(
      () => {
        return childSelector();
      },
      { displayName: 'parent' },
    );

    const childSelectorCheck = new DebugInfoCheckUtil(childSelector);
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
    childSelectorCheck.expectMultiple([
      ['depCheck', 'run'],
      ['invoked', 'skipped'],
    ]);
    parentSelectorCheck.expectInvoked('run');

    // Cached again
    expect(parentSelector(state)).toEqual(2);
    childSelectorCheck.expectUntouched();
    parentSelectorCheck.expectInvoked('skipped');
  });

  test('get value from stacked child selectors', () => {
    const bottomSelector = createDynamicSelector((getState) => {
      return getState('a');
    });
    const middleSelector = createDynamicSelector(() => {
      return bottomSelector() + 10;
    });
    const topSelector = createDynamicSelector(() => {
      return middleSelector();
    });

    const bottomSelectorCheck = new DebugInfoCheckUtil(bottomSelector);
    const middleSelectorCheck = new DebugInfoCheckUtil(middleSelector);
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
    bottomSelectorCheck.expectMultiple([
      ['depCheck', 'run'],
      ['depCheck', 'skipped'],
    ]);
    middleSelectorCheck.expectMultiple([
      ['depCheck', 'run'],
      ['invoked', 'skipped'],
    ]);
    topSelectorCheck.expectInvoked('run');

    // Cached again
    expect(topSelector(state)).toEqual(12);
    bottomSelectorCheck.expectUntouched();
    middleSelectorCheck.expectUntouched();
    topSelectorCheck.expectInvoked('skipped');
  });

  test('get value from overlapping child selectors', () => {
    // This is a Rube Goldberg machine for calculating `a * (a + 1) * (a + 11)`.
    // The dependency graph is:
    //  - topSelector
    //    - rawSelector
    //    - midSelector1
    //      - rawSelector
    //    - midSelector2
    //      - midSelector1
    //        - rawSelector
    const rawSelector = createDynamicSelector((getState) => {
      return getState('a');
    });

    const midSelector1 = createDynamicSelector(() => {
      return rawSelector() + 1;
    });
    const midSelector2 = createDynamicSelector(() => {
      return midSelector1() + 10;
    });

    const topSelector = createDynamicSelector(() => {
      return rawSelector() * midSelector1() * midSelector2();
    });

    const rawSelectorCheck = new DebugInfoCheckUtil(rawSelector);
    const midSelector1Check = new DebugInfoCheckUtil(midSelector1);
    const midSelector2Check = new DebugInfoCheckUtil(midSelector2);
    const topSelectorCheck = new DebugInfoCheckUtil(topSelector);

    let state = { a: 1 };

    // Normal run: every selector runs, and a few get checked again because they're shared
    expect(topSelector(state)).toEqual(24);
    // run by topSelector, midSelector1
    rawSelectorCheck.expectMultiple([
      ['invoked', 'run'],
      ['invoked', 'skipped'],
    ]);
    // run by topSelector, midSelector2
    midSelector1Check.expectMultiple([
      ['invoked', 'run'],
      ['invoked', 'skipped'],
    ]);
    midSelector2Check.expectInvoked('run');
    topSelectorCheck.expectInvoked('run');

    // Now it's cached by state
    expect(topSelector(state)).toEqual(24);
    rawSelectorCheck.expectUntouched();
    midSelector1Check.expectUntouched();
    midSelector2Check.expectUntouched();
    topSelectorCheck.expectInvoked('skipped');

    state = { a: 1 };

    // Top depchecks raw and middle1 and middle2, middle2 depchecks middle1, middle1 and middle2 depcheck raw.
    // Everything just ends up skipped.
    expect(topSelector(state)).toEqual(24);
    rawSelectorCheck.expectMultiple([
      ['depCheck', 'skipped'],
      ['depCheck', 'skipped'],
    ]);
    midSelector1Check.expectMultiple([
      ['depCheck', 'skipped'],
      ['depCheck', 'skipped'],
    ]);
    midSelector2Check.expectDepChecked('skipped');
    topSelectorCheck.expectInvoked('skipped');

    // Cached again
    expect(topSelector(state)).toEqual(24);
    rawSelectorCheck.expectUntouched();
    midSelector1Check.expectUntouched();
    midSelector2Check.expectUntouched();
    topSelectorCheck.expectInvoked('skipped');

    state = { a: 2 };

    // Top depchecks raw (which runs), top depchecks middle1 (which depchecks raw and gets its newly-cached value,
    // causing a rerun), top depchecks middle2 (which depchecks middle1 and gets its newly-cached value, causing
    // a rerun)
    expect(topSelector(state)).toEqual(78);
    rawSelectorCheck.expectMultiple([
      ['invoked', 'run'],
      ['depCheck', 'skipped'],
      ['invoked', 'skipped'],
      ['depCheck', 'skipped'],
    ]);
    midSelector1Check.expectMultiple([
      ['invoked', 'run'],
      ['depCheck', 'skipped'],
      ['invoked', 'skipped'],
    ]);
    midSelector2Check.expectInvoked('run');
    topSelectorCheck.expectInvoked('run');

    // Cached again
    expect(topSelector(state)).toEqual(78);
    rawSelectorCheck.expectUntouched();
    midSelector1Check.expectUntouched();
    midSelector2Check.expectUntouched();
    topSelectorCheck.expectInvoked('skipped');
  });

  test('get value from overlapping child selectors, in reverse order', () => {
    // This is a Rube Goldberg machine for calculating `(a + 11) * (a + 1) * 1`.
    // The exact same number of overall operations happen as the original order
    //
    // The dependency graph is:
    //  - topSelector
    //    - midSelector2
    //      - midSelector1
    //        - rawSelector
    //    - midSelector1
    //      - rawSelector
    //    - rawSelector
    const rawSelector = createDynamicSelector((getState) => {
      return getState('a');
    });

    const midSelector1 = createDynamicSelector(() => {
      return rawSelector() + 1;
    });
    const midSelector2 = createDynamicSelector(() => {
      return midSelector1() + 10;
    });

    const topSelector = createDynamicSelector(() => {
      return midSelector2() * midSelector1() * rawSelector();
    });

    const rawSelectorCheck = new DebugInfoCheckUtil(rawSelector);
    const midSelector1Check = new DebugInfoCheckUtil(midSelector1);
    const midSelector2Check = new DebugInfoCheckUtil(midSelector2);
    const topSelectorCheck = new DebugInfoCheckUtil(topSelector);

    let state = { a: 1 };

    // Normal run: every selector runs, and a few get checked again because they're shared
    expect(topSelector(state)).toEqual(24);
    // run by topSelector, midSelector1
    rawSelectorCheck.expectMultiple([
      ['invoked', 'run'],
      ['invoked', 'skipped'],
    ]);
    // run by topSelector, midSelector2
    midSelector1Check.expectMultiple([
      ['invoked', 'run'],
      ['invoked', 'skipped'],
    ]);
    midSelector2Check.expectInvoked('run');
    topSelectorCheck.expectInvoked('run');

    // Now it's cached by state
    expect(topSelector(state)).toEqual(24);
    rawSelectorCheck.expectUntouched();
    midSelector1Check.expectUntouched();
    midSelector2Check.expectUntouched();
    topSelectorCheck.expectInvoked('skipped');

    state = { a: 1 };

    // Top depchecks raw and middle1 and middle2, middle2 depchecks middle1, middle1 and middle2 depcheck raw.
    // Everything just ends up skipped.
    expect(topSelector(state)).toEqual(24);
    rawSelectorCheck.expectMultiple([
      ['depCheck', 'skipped'],
      ['depCheck', 'skipped'],
    ]);
    midSelector1Check.expectMultiple([
      ['depCheck', 'skipped'],
      ['depCheck', 'skipped'],
    ]);
    midSelector2Check.expectDepChecked('skipped');
    topSelectorCheck.expectInvoked('skipped');

    // Cached again
    expect(topSelector(state)).toEqual(24);
    rawSelectorCheck.expectUntouched();
    midSelector1Check.expectUntouched();
    midSelector2Check.expectUntouched();
    topSelectorCheck.expectInvoked('skipped');

    state = { a: 2 };

    // Top depchecks raw (which runs), top depchecks middle1 (which depchecks raw and gets its newly-cached value,
    // causing a rerun), top depchecks middle2 (which depchecks middle1 and gets its newly-cached value, causing
    // a rerun)
    expect(topSelector(state)).toEqual(78);
    rawSelectorCheck.expectMultiple([
      ['invoked', 'run'],
      ['depCheck', 'skipped'],
      ['depCheck', 'skipped'],
    ]);
    midSelector1Check.expectMultiple([
      ['invoked', 'run'],
      ['depCheck', 'skipped'],
      ['depCheck', 'skipped'],
    ]);
    midSelector2Check.expectMultiple([
      ['invoked', 'run'],
      ['depCheck', 'skipped'],
    ]);
    topSelectorCheck.expectInvoked('run');

    // Cached again
    expect(topSelector(state)).toEqual(78);
    rawSelectorCheck.expectUntouched();
    midSelector1Check.expectUntouched();
    midSelector2Check.expectUntouched();
    topSelectorCheck.expectInvoked('skipped');
  });
});
