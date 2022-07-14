/* istanbul ignore file */

// Because this is ONLY used in dev mode, it's stored as a normal object instead of an array
export type DynamicSelectorDebugInfo = {
  _verbose?: boolean | string;
  depCheckCount: number;
  invokeCount: number;
  skippedRunCount: number;
  phantomRunCount: number;
  fullRunCount: number;
  abortedRunCount: number;
} | null;

const createDebugInfo = (): DynamicSelectorDebugInfo => {
  if (process.env.NODE_ENV !== 'production') {
    return {
      depCheckCount: 0,
      invokeCount: 0,
      skippedRunCount: 0,
      phantomRunCount: 0,
      fullRunCount: 0,
      abortedRunCount: 0,
    };
  }
  return null;
};

const debugLogVerbose = (
  debugInfo: DynamicSelectorDebugInfo,
  label: string,
  ...moreInfo: Array<unknown>
) => {
  if (process.env.NODE_ENV !== 'production' && debugInfo && debugInfo._verbose) {
    const labelPrefix = typeof debugInfo._verbose === 'string' ? `${debugInfo._verbose}: ` : '';
    console.log(labelPrefix + label, ...moreInfo, debugInfo);
  }
};

const debugDepCheck = (debugInfo: DynamicSelectorDebugInfo) => {
  if (process.env.NODE_ENV !== 'production' && debugInfo) {
    debugInfo.depCheckCount++;
    debugLogVerbose(debugInfo, 'Begin DepCheck');
  }
};

const debugInvoked = (debugInfo: DynamicSelectorDebugInfo) => {
  if (process.env.NODE_ENV !== 'production' && debugInfo) {
    debugInfo.invokeCount++;
    debugLogVerbose(debugInfo, 'Begin Invoke');
  }
};

const debugSkippedRun = (debugInfo: DynamicSelectorDebugInfo) => {
  if (process.env.NODE_ENV !== 'production' && debugInfo) {
    debugInfo.skippedRunCount++;
    debugLogVerbose(debugInfo, 'Skipped!');
  }
};

const debugPhantomRun = (debugInfo: DynamicSelectorDebugInfo) => {
  if (process.env.NODE_ENV !== 'production' && debugInfo) {
    debugInfo.phantomRunCount++;
    debugLogVerbose(debugInfo, 'Phantom!');
  }
};

const debugFullRun = (debugInfo: DynamicSelectorDebugInfo) => {
  if (process.env.NODE_ENV !== 'production' && debugInfo) {
    debugInfo.fullRunCount++;
    debugLogVerbose(debugInfo, 'Full run!');
  }
};

const debugAbortedRun = (debugInfo: DynamicSelectorDebugInfo) => {
  if (process.env.NODE_ENV !== 'production' && debugInfo) {
    debugInfo.abortedRunCount++;
    debugLogVerbose(debugInfo, 'Aborted!');
  }
};

export {
  createDebugInfo,
  debugLogVerbose,
  debugDepCheck,
  debugInvoked,
  debugSkippedRun,
  debugPhantomRun,
  debugFullRun,
  debugAbortedRun,
};
