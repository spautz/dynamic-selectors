module.exports = {
  root: true,
  extends: [
    'react-app',
    'eslint:recommended',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
  ],

  settings: {
    react: {
      version: 'detect',
    },
  },
  parserOptions: {
    ecmaVersion: 2020,
  },

  ignorePatterns: [
    'build/',
    'coverage/',
    'coverage-local/',
    'dist/',
    'legacy-types/',
    'lib-dist/',
    'node_modules/',
  ],
};
