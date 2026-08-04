import { expect } from 'vitest';

import { DebugInfoCheckUtil } from './src/devOnlyUtils/DebugInfoCheckUtil.ts';

DebugInfoCheckUtil.setDefaultExpectFn(expect);
