const loader = require('./js/nrs.webworker.bridge.js')

const config = require('./config.json')

loader.init({
  url: config.url,
  secretPhrase: config.secretPhrase,
  isTestNet: config.isTestNet,
  adminPassword: config.adminPassword,
})

const ready = new Promise((resolve) => {
  loader.load(resolve)
})

ready.then(() => {
  console.log('module configured and ready') // eslint-disable-line no-console
})
