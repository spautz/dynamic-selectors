import { defineConfig } from 'tsdown';

import { baseConfigValues } from '../../tsdown-base-config.ts';

export default defineConfig(
  baseConfigValues.map((config) => ({
    ...config,
    entry: [...(config.entry as Array<string>), 'src/index.dev-only.ts'],
  })),
);
