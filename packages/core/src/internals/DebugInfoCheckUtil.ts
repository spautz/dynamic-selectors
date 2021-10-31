import {
  DynamicSelectorDebugInfo,
  createDebugInfo,
  debugAbortedRun,
  debugDepCheck,
  debugFullRun,
  debugInvoked,
  debugPhantomRun,
  debugSkippedRun,
} from './index';
import { DynamicSelectorFn, DynamicSelectorParams } from '../index';

type ExpectedDebugInfoEntryType = 'depCheck' | 'invoked';
type ExpectedDebugInfoResultType = 'skipped' | 'phantom' | 'run' | 'aborted';

/**
 * Accumulates the expected results for a selector over time. This avoids having to write out a long-form
 * check between every single selector call in the tests.
 */
class DebugInfoCheckUtil {
  _expectedDebugInfo: DynamicSelectorDebugInfo;
  _defaultSelector: DynamicSelectorFn;
  _defaultParams: DynamicSelectorParams;

  constructor(defaultSelector?: DynamicSelectorFn, defaultParams?: DynamicSelectorParams) {
    this._expectedDebugInfo = createDebugInfo();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: We don't care if this is undefined, because it can be provided later
    this._defaultSelector = defaultSelector;
    this._defaultParams = defaultParams;
  }

  // User- and Test-friendly API

  expectDepChecked(
    result: ExpectedDebugInfoResultType,
    selector: DynamicSelectorFn = this._defaultSelector,
    params: DynamicSelectorParams = this._defaultParams,
  ): void {
    this._logExpectedEntry('depCheck');
    this._logExpectedResult(result);
    this._checkLogs(selector, params);
  }

  expectInvoked(
    result: ExpectedDebugInfoResultType,
    selector: DynamicSelectorFn = this._defaultSelector,
    params: DynamicSelectorParams = this._defaultParams,
  ): void {
    this._logExpectedEntry('invoked');
    this._logExpectedResult(result);
    this._checkLogs(selector, params);
  }

  expectMultiple(
    results: Array<[ExpectedDebugInfoEntryType, ExpectedDebugInfoResultType]>,
    selector: DynamicSelectorFn = this._defaultSelector,
    params: DynamicSelectorParams = this._defaultParams,
  ): void {
    results.forEach(([entry, result]) => {
      this._logExpectedEntry(entry);
      this._logExpectedResult(result);
    });
    this._checkLogs(selector, params);
  }

  expectUntouched(
    selector: DynamicSelectorFn = this._defaultSelector,
    params: DynamicSelectorParams = this._defaultParams,
  ): void {
    if (this._expectedDebugInfo?.invokeCount) {
      return this._checkLogs(selector, params);
    }
    // If it's never been invoked, there should be nothing at all
    expect(selector.getDebugInfo(params)).toEqual(null);
  }

  // Lower-level API

  _checkLogs(
    selector: DynamicSelectorFn = this._defaultSelector,
    params: DynamicSelectorParams = this._defaultParams,
  ): void {
    // Clone so that we can remove the `_verbose` flag from our checks
    const selectorInfo = { ...selector.getDebugInfo(params) } as DynamicSelectorDebugInfo;
    const expectedInfo = { ...this._expectedDebugInfo } as DynamicSelectorDebugInfo;
    if (selectorInfo) {
      delete selectorInfo._verbose;
    }
    if (expectedInfo) {
      delete expectedInfo._verbose;
    }
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
