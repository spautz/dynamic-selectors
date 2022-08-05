import { expect } from 'vitest';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { DebugInfoCheckUtil } from '@dynamic-selectors/core/devOnly';

DebugInfoCheckUtil.setDefaultExpectFn(expect);
