import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // This gets resolved *per project* (each package, plus the root)
    setupFiles: './setupTests.ts',

    coverage: {
      provider: 'c8',
      exclude: [...configDefaults.exclude, '**/__tests__/**', '**/legacy-types/**'],
      reporter: ['html', 'lcov'],
    },
  },
});
