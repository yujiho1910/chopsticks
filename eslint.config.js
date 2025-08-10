// ESLint v9 flat config
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      // The UI intentionally reassigns updateUI via an IIFE wrapper
      'no-func-assign': 'off',
    },
  ignores: ['dist/**', 'public/dist/**', 'node_modules/**'],
  },
];
