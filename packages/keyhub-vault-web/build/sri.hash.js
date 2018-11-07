'use strict'

const fs = require('fs')

// eslint-disable-next-line import/no-extraneous-dependencies
const ssri = require('ssri')

const fileListToSRI = [
  'dist/js/openpgp.worker.bundle.js',
  'public/index.js',
  'public/css/styles.css',
  'public/css/main.css',
]

Promise.all(
  fileListToSRI.map(filepath =>
    ssri.fromStream(fs.createReadStream(filepath), { algorithms: ['sha384'] }).then(sri => {
      console.info(`SRI of ${filepath}:`, sri.toString()) // eslint-disable-line no-console
    })
  )
).catch(err => {
  console.error('cannot hash:', err) // eslint-disable-line no-console
})
