// Because this is ONLY used in dev mode, it's stored as a normal object instead of an array
export type DynamicSelectorDebugInfo = {
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

const debugDepCheck = (debugInfo: DynamicSelectorDebugInfo) => {
  if (process.env.NODE_ENV !== 'production' && debugInfo) {
    debugInfo.depCheckCount++;
  }
};

const debugInvoked = (debugInfo: DynamicSelectorDebugInfo) => {
  if (process.env.NODE_ENV !== 'production' && debugInfo) {
    debugInfo.invokeCount++;
  }
};

const debugSkippedRun = (debugInfo: DynamicSelectorDebugInfo) => {
  if (process.env.NODE_ENV !== 'production' && debugInfo) {
    debugInfo.skippedRunCount++;
  }
};

const debugPhantomRun = (debugInfo: DynamicSelectorDebugInfo) => {
  if (process.env.NODE_ENV !== 'production' && debugInfo) {
    debugInfo.phantomRunCount++;
  }
};

const debugFullRun = (debugInfo: DynamicSelectorDebugInfo) => {
  if (process.env.NODE_ENV !== 'production' && debugInfo) {
    debugInfo.fullRunCount++;
  }
};

const debugAbortedRun = (debugInfo: DynamicSelectorDebugInfo) => {
  if (process.env.NODE_ENV !== 'production' && debugInfo) {
    debugInfo.abortedRunCount++;
  }
};

export {
  createDebugInfo,
  debugDepCheck,
  debugInvoked,
  debugSkippedRun,
  debugPhantomRun,
  debugFullRun,
  debugAbortedRun,
};
