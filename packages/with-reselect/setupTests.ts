import { expect } from 'vitest';

import { DebugInfoCheckUtil } from '@dynamic-selectors/core/dev-only';

DebugInfoCheckUtil.setDefaultExpectFn(expect);
