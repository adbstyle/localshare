module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { node: true, jest: true },
  ignorePatterns: ['dist', 'node_modules', '.eslintrc.js'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
  },
  overrides: [
    // Test suites are one describe() callback each; the function-size rule targets production code.
    { files: ['test/**/*.ts'], rules: { 'max-lines-per-function': 'off' } },
  ],
};
