import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    deps: {
      inline: [/dynamic-selectors/],
    },
    coverage: {
      exclude: [...configDefaults.exclude, '**/__tests__/**', '**/legacy-types/**'],
    },
  },
});
