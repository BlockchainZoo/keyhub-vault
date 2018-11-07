'use strict'

module.exports = {
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 8,
    sourceType: 'script',
  },
  rules: {
    'prettier/prettier': 'warn',

    semi: ['warn', 'never'],

    'spaced-comment': ['warn', 'always'],

    'comma-dangle': ['error', 'always-multiline'],

    'func-names': 'off',

    // 'object-curly-newline': [
    //   'error', {
    //     ObjectExpression: { minProperties: 4, multiline: true, consistent: true },
    //     ObjectPattern: { minProperties: 8, multiline: true, consistent: true },
    //     ImportDeclaration: { minProperties: 8, multiline: true, consistent: true },
    //     ExportDeclaration: { minProperties: 4, multiline: true, consistent: true },
    //   }
    // ],
  },
  env: {
    jest: true,
  },
}
