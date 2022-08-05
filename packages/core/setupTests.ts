import { expect } from 'vitest';

import { DebugInfoCheckUtil } from './src/devOnlyUtils/DebugInfoCheckUtil';

DebugInfoCheckUtil.setDefaultExpectFn(expect);
