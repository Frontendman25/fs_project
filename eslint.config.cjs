const tsParser = require('@typescript-eslint/parser')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const prettierPlugin = require('eslint-plugin-prettier')
const eslintConfigPrettier = require('eslint-config-prettier')

const commonRules = {
  ...eslintConfigPrettier.rules,
  semi: ['error', 'never'],
  'comma-dangle': ['error', 'never'],
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/no-require-imports': 'off',
  '@typescript-eslint/ban-ts-comment': 'off',
  'prettier/prettier': [
    'error',
    {
      semi: false,
      trailingComma: 'none',
      endOfLine: 'auto'
    }
  ]
}

module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.next/**',
      '**/out/**',
      '**/build/**',
      '**/uploads/**',
      '**/uploads-test-e2e/**',
      '**/next-env.d.ts'
    ]
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin
    },
    rules: commonRules
  }
]
