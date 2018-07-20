/* eslint-disable no-console */

const wordlistEnEff = require('diceware-wordlist-en-eff')
const dicewareGen = require('./diceware-generator')

const { NrsBridge } = require('./js/nrs.cheerio.bridge')
// import { NrsBridge } from './js/nrs.cheerio.bridge'

const nxtConfig = require('./conf/nxt.json')
const secrets = require('./conf/secrets.json')


const bridge = new NrsBridge()

bridge.load((NRS) => {
  console.log('NRS-client ready') // eslint-disable-line no-console

  bridge.configure(nxtConfig)

  const fixTxNumberFormat = ({ assetId, decimals, quantity, price, amount, ...txData }) => {
    /* eslint-disable no-param-reassign */
    if (decimals) {
      if (quantity) txData.quantityQNT = NRS.convertToQNT(quantity, decimals)
      if (price) txData.priceNQT = NRS.calculatePricePerWholeQNT(NRS.convertToNQT(price), decimals)
    }
    if (amount) txData.amountNQT = NRS.convertToNQT(amount)
    if (assetId) txData.asset = assetId

    return txData
  }

  const methods = Object.assign(Object.create(null), {
    configure: (config, callback) => {
      if (typeof config !== 'object') throw new Error('Invalid configuration')
      bridge.configure(config)
      callback(null, true)
    },
    generateKeyPair: (wordcount, callback = wordcount) => {
      const randomWords = dicewareGen({
        language: wordlistEnEff,
        wordcount: +wordcount || 9,
        format: 'array',
      })
      const secretPhrase = randomWords.join(' ')
      const publicKey = NRS.generatePublicKey(`eqh${secretPhrase}`)
      const accountId = NRS.getAccountIdFromPublicKey(publicKey)
      const accountRS = NRS.convertNumericToRSAccountFormat(accountId)

      callback(null, {
        secretPhrase,
        publicKey,
        accountId,
        accountRS,
      })
    },
    signTransaction: (txType, txData, callback) => {
      if (typeof txType !== 'string') throw new Error('Invalid transaction type')
      if (typeof txData !== 'object') throw new Error('Invalid transaction data')

      const { secretPhrase } = secrets
      const data = {
        ...fixTxNumberFormat(txData),
        broadcast: 'false',
        secretPhrase: `eqh${secretPhrase}`,
        ...NRS.getMandatoryParams(),
      }

      NRS.sendRequest(txType, data, (response) => {
        callback(null, response)
      })
    },
  })

  if (typeof self !== 'undefined') { // eslint-disable-line no-restricted-globals
    self.onmessage = (event) => { // eslint-disable-line no-undef, no-restricted-globals
      const { data: [name, ...params] } = event
      const safeParams = params.filter(p => ['number', 'string', 'boolean', 'object'].includes(typeof p))
      if (name in methods) {
        try {
          methods[name](...safeParams, (err, res) => {
            if (err) {
              // eslint-disable-next-line no-undef, no-restricted-globals
              self.postMessage({ error: err.message || err })
            } else {
              // eslint-disable-next-line no-undef, no-restricted-globals
              self.postMessage(res)
            }
          })
        } catch (err) {
          // eslint-disable-next-line no-undef, no-restricted-globals
          self.postMessage({ error: err.message || err })
        }
      }
    }
  }

  // // Generate New KeyPair
  // console.log('Generating a new account...')
  // methods.generateKeyPair((err, res) => {
  //   if (err) throw err
  //   console.log(res)
  // })

  // // Send Transaction
  // console.log('Sending a transaction...')
  // const property = '$$Trader'
  // const recipient = 'EQH-4226-5SWH-A9CM-8W7P6'
  // const recipientPublicKey = 'd6b0716dce96a33d224100c15437013d3e550f025119918e86859075ae730133'
  // const recipientId = recipientPublicKey
  //   ? NRS.getAccountIdFromPublicKey(recipientPublicKey)
  //   : NRS.convertRSToNumericAccountFormat(recipient)
  // const recipientRS = NRS.convertNumericToRSAccountFormat(recipientId)
  // console.info('property:', property)
  // console.info('recipientId:', recipientId)
  // console.info('recipientRS:', recipientRS)

  // const txData = {
  //   recipient: recipientId,
  //   recipientPublicKey,
  //   property,
  //   value: '1',
  // }

  // methods.signTransaction('setAccountProperty', txData, (err, response) => {
  //   if (err) throw err
  //   console.log(JSON.stringify(response, null, 2))
  // })
})
