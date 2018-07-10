const loader = require('./js/nrs.node.bridge')
// import loader from './js/nrs.cheerio.bridge'

const loadNRS = (config) => {
  loader.init({
    url: config.url,
    secretPhrase: config.secretPhrase,
    isTestNet: config.isTestNet,
    adminPassword: config.adminPassword,
  })

  return new Promise((resolve, reject) => {
    try {
      loader.load(resolve)
    } catch (err) {
      reject(err)
    }
  })
}

const config = require('./config.json')

loadNRS(config).then((NRS) => {
  console.log('module configured and ready') // eslint-disable-line no-console

  const property = '$$RootAdmin'

  const recipient = NRS.getAccountIdFromPublicKey(config.recipientPublicKey)
  const recipientRS = NRS.convertNumericToRSAccountFormat(recipient)
  console.log(recipient)
  console.log(recipientRS)

  const data = {
    recipient,
    property,
    value: '1',
    secretPhrase: config.secretPhrase,
    ...NRS.getMandatoryParams(),
  }

  NRS.sendRequest('setAccountProperty', data, (response) => {
    NRS.logConsole(JSON.stringify(response))
  })
})
