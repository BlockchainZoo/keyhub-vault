'use strict'

module.exports = {
  'plugins': [
    'lodash-template'
  ],
  'extends': [
    'airbnb',
    // 'plugin:lodash-template/recommended-with-html',
  ],
  'rules': {
    // http://eslint.org/docs/rules/semi
    // no semi-colons (YOLO) .. if you really want semicolons, remove this rule and run
    // '.\node_modules\.bin\eslint --fix src' from the app root to re-add
    'semi': ['warn', 'never'],

    'spaced-comment': ['warn', 'always'],

    'comma-dangle': ['error', 'always-multiline'],

    'func-names': 'off',

    'object-curly-newline': [
      'error', {
        ObjectExpression: { minProperties: 4, multiline: true, consistent: true },
        ObjectPattern: { minProperties: 8, multiline: true, consistent: true },
        ImportDeclaration: { minProperties: 8, multiline: true, consistent: true },
        ExportDeclaration: { minProperties: 4, multiline: true, consistent: true },
      }
    ],
  },
  'env': {
    'jest': true,
  }
};