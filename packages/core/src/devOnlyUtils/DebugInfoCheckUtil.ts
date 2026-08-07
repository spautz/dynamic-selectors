/* c8 ignore start */

import type { DynamicSelectorDebugInfo } from '../internals/debugInfo.js';
import {
  createDebugInfo,
  debugAbortedRun,
  debugDepCheck,
  debugFullRun,
  debugInvoked,
  debugPhantomRun,
  debugSkippedRun,
} from '../internals/debugInfo.js';
import type { AnyDynamicSelectorFn, DynamicSelectorParams } from '../types.js';

type ExpectedDebugInfoEntryType = 'depCheck' | 'invoked';
type ExpectedDebugInfoResultType = 'skipped' | 'phantom' | 'run' | 'aborted';

// @FIXME
// biome-ignore lint/suspicious/noExplicitAny: expectFn from test framework has no shared type
type ExpectFn = any;

/**
 * Accumulates the expected results for a selector over time. This avoids having to write out a long-form
 * check between every single selector call in the tests.
 */
class DebugInfoCheckUtil {
  static _defaultExpectFn: ExpectFn;
  static setDefaultExpectFn = (expectFn: ExpectFn): void => {
    DebugInfoCheckUtil._defaultExpectFn = expectFn;
  };

  _expectFn: ExpectFn;
  _expectedDebugInfo: DynamicSelectorDebugInfo;
  _defaultSelector: AnyDynamicSelectorFn;
  _defaultParams: DynamicSelectorParams;

  constructor(defaultSelector?: AnyDynamicSelectorFn, defaultParams?: DynamicSelectorParams) {
    this._expectedDebugInfo = createDebugInfo();
    // @ts-expect-error: We don't care if this is undefined, because it can be provided later
    this._defaultSelector = defaultSelector;
    this._defaultParams = defaultParams;
  }

  setExpectFn(expectFn: ExpectFn): void {
    this._expectFn = expectFn;
  }
  getExpectFn(): ExpectFn {
    const expect = this._expectFn || DebugInfoCheckUtil._defaultExpectFn;
    if (!expect) {
      throw new Error('DebugInfoCheckUtil must be given an `expect` function');
    }
    return expect;
  }

  // User- and Test-friendly API

  expectDepChecked(
    result: ExpectedDebugInfoResultType,
    selector: AnyDynamicSelectorFn = this._defaultSelector,
    params: DynamicSelectorParams = this._defaultParams,
  ): void {
    this._logExpectedEntry('depCheck');
    this._logExpectedResult(result);
    this._checkLogs(selector, params);
  }

  expectInvoked(
    result: ExpectedDebugInfoResultType,
    selector: AnyDynamicSelectorFn = this._defaultSelector,
    params: DynamicSelectorParams = this._defaultParams,
  ): void {
    this._logExpectedEntry('invoked');
    this._logExpectedResult(result);
    this._checkLogs(selector, params);
  }

  expectMultiple(
    results: Array<[ExpectedDebugInfoEntryType, ExpectedDebugInfoResultType]>,
    selector: AnyDynamicSelectorFn = this._defaultSelector,
    params: DynamicSelectorParams = this._defaultParams,
  ): void {
    for (const [entry, result] of results) {
      this._logExpectedEntry(entry);
      this._logExpectedResult(result);
    }
    this._checkLogs(selector, params);
  }

  expectUntouched(
    selector: AnyDynamicSelectorFn = this._defaultSelector,
    params: DynamicSelectorParams = this._defaultParams,
  ): void {
    if (this._expectedDebugInfo?.invokeCount) {
      this._checkLogs(selector, params);
      return;
    }
    // If it's never been invoked, there should be nothing at all
    const expect = this.getExpectFn();
    expect(selector.getDebugInfo(params)).toEqual(null);
  }

  // Lower-level API

  _checkLogs(
    selector: AnyDynamicSelectorFn = this._defaultSelector,
    params: DynamicSelectorParams = this._defaultParams,
  ): void {
    // Clone so that we can remove the `_verbose` flag from our checks
    const selectorInfo = { ...selector.getDebugInfo(params) } as DynamicSelectorDebugInfo;
    const expectedInfo = { ...this._expectedDebugInfo } as DynamicSelectorDebugInfo;
    if (selectorInfo) {
      // biome-ignore lint/performance/noDelete: Ensure the `_verbose` flag doesn't affect the comparison
      delete selectorInfo._verbose;
    }
    if (expectedInfo) {
      // biome-ignore lint/performance/noDelete: Ensure the `_verbose` flag doesn't affect the comparison
      delete expectedInfo._verbose;
    }
    const expect = this.getExpectFn();
    expect(selectorInfo).toEqual(this._expectedDebugInfo);
  }

  _logExpectedEntry(entry: ExpectedDebugInfoEntryType): void {
    switch (entry) {
      case 'depCheck': {
        debugDepCheck(this._expectedDebugInfo);
        break;
      }
      case 'invoked': {
        debugInvoked(this._expectedDebugInfo);
        break;
      }
      default: {
        throw new Error(`Invalid expectedEntry: ${entry}`);
      }
    }
  }

  _logExpectedResult(result: ExpectedDebugInfoResultType): void {
    switch (result) {
      case 'skipped': {
        debugSkippedRun(this._expectedDebugInfo);
        break;
      }
      case 'phantom': {
        debugPhantomRun(this._expectedDebugInfo);
        break;
      }
      case 'run': {
        debugFullRun(this._expectedDebugInfo);
        break;
      }
      case 'aborted': {
        debugAbortedRun(this._expectedDebugInfo);
        break;
      }
      default: {
        throw new Error(`Invalid expectedResult: ${result}`);
      }
    }
  }
}

export { DebugInfoCheckUtil };

/* c8 ignore stop */
