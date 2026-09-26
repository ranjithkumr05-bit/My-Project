// ESLint 9 flat config. Scope is deliberately narrow: catch real bugs (unused
// code, broken hook deps, wrong JSX) without restating Prettier's job. No
// stylistic rules are enabled here — `npm run format` owns formatting.
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  {ignores: ['dist/**', 'node_modules/**', 'test-results/**', 'playwright-report/**']},
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {...globals.browser, ...globals.node},
      parserOptions: {ecmaFeatures: {jsx: true}},
    },
    settings: {react: {version: 'detect'}},
    plugins: {react, 'react-hooks': reactHooks},
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // The new JSX transform makes these obsolete; React 18 never needs them.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // A bare apostrophe in JSX text is valid and renders as "'". "Fixing" it
      // rewrites visible copy as an HTML entity for no gain, so this stays off.
      'react/no-unescaped-entities': 'off',
      'no-unused-vars': ['error', {argsIgnorePattern: '^_', varsIgnorePattern: '^_'}],
    },
  },
]
