import {
  DynamicSelectorDebugInfo,
  createDebugInfo,
  debugAbortedRun,
  debugDepCheck,
  debugFullRun,
  debugInvoked,
  debugPhantomRun,
  debugSkippedRun,
} from '../src/internals';
import { DynamicSelectorFn, DynamicSelectorParams } from '../src';

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
    // @ts-ignore: We don't care if this is undefined, because it can be provided later
    this._defaultSelector = defaultSelector;
    this._defaultParams = defaultParams;
  }

  expectDepChecked(
    result: ExpectedDebugInfoResultType,
    selector: DynamicSelectorFn = this._defaultSelector,
    params: DynamicSelectorParams = this._defaultParams,
  ) {
    debugDepCheck(this._expectedDebugInfo);
    this._logExpectedResult(result);
    this._checkExpect(selector, params);
  }

  expectInvoked(
    result: ExpectedDebugInfoResultType,
    selector: DynamicSelectorFn = this._defaultSelector,
    params: DynamicSelectorParams = this._defaultParams,
  ) {
    debugInvoked(this._expectedDebugInfo);
    this._logExpectedResult(result);
    this._checkExpect(selector, params);
  }

  expectDepCheckAndInvoked(
    depCheckResult: ExpectedDebugInfoResultType,
    invokeResult: ExpectedDebugInfoResultType,
    selector: DynamicSelectorFn = this._defaultSelector,
    params: DynamicSelectorParams = this._defaultParams,
  ) {
    debugDepCheck(this._expectedDebugInfo);
    this._logExpectedResult(depCheckResult);
    debugInvoked(this._expectedDebugInfo);
    this._logExpectedResult(invokeResult);
    this._checkExpect(selector, params);
  }

  // This is ONLY syntactic sugar to make the tests read nicer
  expectUntouched(
    selector: DynamicSelectorFn = this._defaultSelector,
    params: DynamicSelectorParams = this._defaultParams,
  ) {
    return this._checkExpect(selector, params);
  }

  _checkExpect(
    selector: DynamicSelectorFn = this._defaultSelector,
    params: DynamicSelectorParams = this._defaultParams,
  ) {
    expect(selector.getDebugInfo(params)).toEqual(this._expectedDebugInfo);
  }

  _logExpectedResult(result: ExpectedDebugInfoResultType) {
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

export default DebugInfoCheckUtil;
