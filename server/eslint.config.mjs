import js from '@eslint/js'
import globals from 'globals'
import prettier from 'eslint-config-prettier'

export default [
  { ignores: ['node_modules'] },
  {
    files: ['**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      globals: globals.node,
      ecmaVersion: 2022,
    },
  },
  prettier,
]
