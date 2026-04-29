const path = require('path')
const { createRequire } = require('module')

function requireFromAvailable(moduleName) {
  const candidates = [
    createRequire(__filename),
    createRequire(path.join(process.cwd(), 'package.json')),
    createRequire(path.join(process.cwd(), 'backend', 'package.json')),
    createRequire(path.join(process.cwd(), 'frontend', 'package.json'))
  ]

  for (const localRequire of candidates) {
    try {
      return localRequire(moduleName)
    } catch (_error) {
      // Try next candidate.
    }
  }

  throw new Error(
    `Cannot resolve "${moduleName}". Install it in root or workspace dependencies.`
  )
}

const tsParser = requireFromAvailable('@typescript-eslint/parser')
const tsPlugin = requireFromAvailable('@typescript-eslint/eslint-plugin')
const prettierPlugin = requireFromAvailable('eslint-plugin-prettier')
const eslintConfigPrettier = requireFromAvailable('eslint-config-prettier')

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
