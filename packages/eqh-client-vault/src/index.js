const loader = require('./js/nrs.node.bridge')

const config = require('./config.json')

loader.init({
  url: config.url,
  secretPhrase: config.secretPhrase,
  isTestNet: config.isTestNet,
  adminPassword: config.adminPassword,
})

const ready = new Promise((resolve, reject) => {
  try {
    loader.load(resolve)
  } catch (err) {
    reject(err)
  }
})

ready.then(() => {
  console.log('module configured and ready') // eslint-disable-line no-console
})
