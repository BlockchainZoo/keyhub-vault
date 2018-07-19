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

  // Generate new account
  console.log('Generating an account...')
  const publicKey = NRS.generatePublicKey(config.secretPhrase)
  console.log('Your New Public Key:', publicKey)
  const accountId = NRS.getAccountIdFromPublicKey(publicKey)
  console.log('Your New Account Id:', accountId)
  const accountRS = NRS.convertNumericToRSAccountFormat(accountId)
  console.log('Your New Account Address:', accountRS)

  // Send Transaction
  console.log('Sending a transaction...')
  const property = '$$Trader'
  const recipient = 'EQH-4226-5SWH-A9CM-8W7P6'
  const recipientPublicKey = 'd6b0716dce96a33d224100c15437013d3e550f025119918e86859075ae730133'
  const recipientId = recipientPublicKey
    ? NRS.getAccountIdFromPublicKey(recipientPublicKey)
    : NRS.convertRSToNumericAccountFormat(recipient)
  const recipientRS = NRS.convertNumericToRSAccountFormat(recipientId)
  console.info('property:', property)
  console.info('recipientId:', recipientId)
  console.info('recipientRS:', recipientRS)

  const data = {
    recipient: recipientId,
    recipientPublicKey,
    property,
    value: '1',
    secretPhrase: config.secretPhrase,
    ...NRS.getMandatoryParams(),
  }

  NRS.sendRequest('setAccountProperty', data, (response) => {
    NRS.logConsole(JSON.stringify(response, null, 2))
  })
})
