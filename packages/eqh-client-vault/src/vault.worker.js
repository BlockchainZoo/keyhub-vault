
const wordlistEnEff = require('diceware-wordlist-en-eff')
const dicewareGen = require('./diceware-generator')
const { callOnStore } = require('./util/indexeddb')
const { secureRandom, getCryptoSubtle } = require('./util/crypto')

const subtle = getCryptoSubtle()

const { NrsBridge } = require('./js/nrs.cheerio.bridge')
// import { NrsBridge } from './js/nrs.cheerio.bridge'
const bridge = new NrsBridge()

global.isNode = true
const converters = require('./js/util/converters')

const nxtConfig = require('./conf/nxt.json')
const secrets = require('./conf/secrets.json')

bridge.load((NRS) => {
  console.log('NRS-bridge ready') // eslint-disable-line no-console

  bridge.configure(nxtConfig)

  const fixTxNumberFormat = ({ assetId, decimals, quantity, price, amount, ...txData }) => {
    /* eslint-disable no-param-reassign */
    if (decimals !== undefined) {
      if (quantity) txData.quantityQNT = NRS.convertToQNT(quantity, decimals)
      if (price) txData.priceNQT = NRS.calculatePricePerWholeQNT(NRS.convertToNQT(price), decimals)
    }
    if (amount !== undefined) txData.amountNQT = NRS.convertToNQT(amount)
    if (assetId !== undefined) txData.asset = assetId

    return txData
  }

  const methods = Object.assign(Object.create(null), {
    configure: (config, callback) => {
      if (typeof config !== 'object') throw new Error('Invalid configuration')
      bridge.configure(config)
      callback(null, true)
    },
    generateSecretPhrase: (wordcount, callback = wordcount) => {
      const randomWords = dicewareGen({
        language: wordlistEnEff,
        wordcount: +wordcount || 13,
        format: 'array',
      })
      const secretPhrase = randomWords.join(' ')

      callback(null, {
        secretPhrase,
      })
    },
    storeKeyPair: (platform, secretPhrase, secretPin, callback) => {
      const deriveParams = {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: secureRandom(16, { type: 'Uint8Array' }),
        iterations: 1e6,
      }

      const secretPhraseUint8 = Uint8Array.from(converters.stringToByteArray(secretPhrase))
      const secretPinUint8 = Uint8Array.from(converters.stringToByteArray(secretPin))

      subtle.digest({ name: 'SHA-512' }, secretPhraseUint8).then(secretPhraseHashBuffer => (
        subtle.importKey('raw', secretPinUint8, 'PBKDF2', false, ['deriveKey']).then(weakKey => (
          subtle.deriveKey(deriveParams, weakKey, { name: 'AES-CBC', length: 256 }, false, ['encrypt'])
        )).then((strongKey) => {
          const encryptParams = {
            name: 'AES-CBC',
            iv: secureRandom(16, { type: 'Uint8Array' }),
          }
          return subtle.encrypt(encryptParams, strongKey, secretPhraseHashBuffer)
        }).then((encryptedSecretPhraseHashBuffer) => {
          const secretPhraseHashHex = converters.byteArrayToHexString(
            Array.from(new Uint8Array(secretPhraseHashBuffer))
          )
          const encryptedSecretPhraseHashHex = converters.byteArrayToHexString(
            Array.from(new Uint8Array(encryptedSecretPhraseHashBuffer))
          )
          return [secretPhraseHashHex, encryptedSecretPhraseHashHex]
        })
      )).then(([secretPhraseHashHex, encryptedSecretPhraseHashHex]) => {
        const publicKey = NRS.generatePublicKey(secretPhraseHashHex)
        const accountId = NRS.getAccountIdFromPublicKey(publicKey)
        const accountRS = NRS.convertNumericToRSAccountFormat(accountId)
        callOnStore('accounts', (store) => {
          store.put({
            id: `${platform}-${accountId}`,
            platform,
            number: accountId,
            address: accountRS,
            publicKey,
            secretPhrase: {
              encrypted: encryptedSecretPhraseHashHex,
              algo: deriveParams.name,
              hash: deriveParams.hash,
              iterations: deriveParams.iterations,
              salt: converters.byteArrayToHexString(Array.from(deriveParams.salt)),
            },
          })
        })
        callback(null, {
          publicKey,
          accountId,
          accountRS,
        })
      }).catch(error => callback(error))
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
  // console.log('Sending a setAccountProperty transaction...')
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

  // // Send Transaction
  // console.log('Sending a placeBidOrder transaction...')
  // const decimals = 2
  // const quantity = 2.5
  // const price = 1.3

  // const txData = {
  //   asset: '6889644787748004524', // testnet Megasset
  //   quantityQNT: NRS.convertToQNT(quantity, decimals),
  //   priceNQT: NRS.calculatePricePerWholeQNT(NRS.convertToNQT(price), decimals),
  // }

  // methods.signTransaction('placeBidOrder', txData, (err, response) => {
  //   if (err) throw err
  //   console.log(JSON.stringify(response, null, 2))
  // })

  // methods.storeKeyPair('secret here', 'pin123456', (err, res) => {
  //   console.log(err, res)
  // })
})
