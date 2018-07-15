const loader = require('./js/nrs.cheerio.bridge')
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

const config = require('./conf/secrets.json')

loadNRS(config).then((NRS) => {
  // heri16@github.com: Will use cryptographic signature verification on claims of known blocks
  NRS.constants.LAST_KNOWN_BLOCK = { id: '15547113949993887183', height: '712' } // eslint-disable-line no-param-reassign
  NRS.constants.LAST_KNOWN_TESTNET_BLOCK = { id: '15547113949993887183', height: '712' } // eslint-disable-line no-param-reassign

  console.log('NRS-client ready') // eslint-disable-line no-console

  const property = '$$Trader'

  const recipient = NRS.getAccountIdFromPublicKey(config.recipientPublicKey)
  const recipientRS = NRS.convertNumericToRSAccountFormat(recipient)

  console.info('property:', property)
  console.info('recipientId:', recipient)
  console.info('recipientRS:', recipientRS)

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
