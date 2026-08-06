import { defineConfig, type UserConfig } from 'tsdown';

import { baseConfigValues } from '../../tsdown-base-config.ts';

const tsdownConfig: Array<UserConfig> = defineConfig(
  baseConfigValues.map((config) => ({
    ...config,
    entry: [...(config.entry as Array<string>), 'src/index.dev-only.ts'],
  })),
);

export default tsdownConfig;
