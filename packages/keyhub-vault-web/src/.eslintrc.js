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
    {
      files: ['main.js', 'util/crypto.js', 'util/indexeddb.js'],
      env: {
        browser: true,
      },
    },
    {
      files: ['vault.worker.js'],
      parserOptions: {
        ecmaFeatures: {
          experimentalObjectRestSpread: true,
        },
      },
    },
  ],
}
