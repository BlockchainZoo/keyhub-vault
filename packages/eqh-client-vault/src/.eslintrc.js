'use strict'

module.exports = {
  overrides: [
    {
      files: ['main.js', 'vault.js', 'screen/*.js'],
      excludedFiles: '*.test.js',
      parserOptions: {
        ecmaVersion: 8,
        sourceType: 'module',
      },
    },
  ],
}
