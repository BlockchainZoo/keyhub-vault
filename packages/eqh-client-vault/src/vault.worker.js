
const wordlistEnEff = require('diceware-wordlist-en-eff')
const dicewareGen = require('./diceware-generator')
const { callOnStore } = require('./util/indexeddb')
const { secureRandom, getCryptoSubtle, unwrapSecretPhrase } = require('./util/crypto')

const subtle = getCryptoSubtle()

const { NrsBridge } = require('./js/nrs.cheerio.bridge')
// import { NrsBridge } from './js/nrs.cheerio.bridge'
const bridge = new NrsBridge()

global.isNode = true
const converters = require('./js/util/converters')

const nxtConfig = require('./conf/nxt.json')

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
      if (typeof config !== 'object') throw new Error('config is not an object')
      if (config.address !== undefined) {
        const { address, ...conf } = config
        conf.accountRS = address
        bridge.configure(conf)
        callback(null, { config: conf })
      } else {
        bridge.configure(config)
        callback(null, { config })
      }
    },
    generatePassphrase: (wordcount, callback = wordcount) => {
      const randomWords = dicewareGen({
        language: wordlistEnEff,
        wordcount: +wordcount || 10,
        format: 'array',
      })
      const passphrase = randomWords.join(' ')

      callback(null, {
        passphrase,
      })
    },
    hasKeyPair: (address, callback) => {
      // Get account from browser's indexedDB
      const dbKey = address
      callOnStore('accounts', (store) => {
        const req = store.get(dbKey)
        req.onerror = err => callback(err)
        req.onsuccess = () => {
          callback(null, !!req.result)
        }
      })
    },
    createKeyPair: (passphrase, secretPin, callback) => {
      if (typeof passphrase !== 'string') throw new Error('passphrase is not a string')
      if (typeof secretPin !== 'string') throw new Error('secretPin is not a string')

      const passphraseUint8 = Uint8Array.from(converters.stringToByteArray(passphrase))
      const secretPinUint8 = Uint8Array.from(converters.stringToByteArray(secretPin))

      const platform = 'EQH'

      const keyAlgo = {
        name: 'AES-GCM',
        length: 256,
      }

      const deriveParams = Object.assign(Object.create(null), {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: secureRandom(16, { type: 'Uint8Array' }).buffer,
        iterations: 1e6,
      })

      const wrapParams = Object.assign(Object.create(null), {
        name: 'AES-GCM',
        iv: secureRandom(12, { type: 'Uint8Array' }).buffer,
      })

      subtle.digest({ name: `SHA-${keyAlgo.length}` }, passphraseUint8).then(secretPhraseBuffer => (
        // Convert teh secretPhrase into a native CryptoKey
        subtle.importKey('raw', secretPhraseBuffer, keyAlgo, true, ['encrypt', 'decrypt'])
      )).then(secretPhraseCryptoKey => (
        // Convert the Pin into a native CryptoKey
        subtle.importKey('raw', secretPinUint8, 'PBKDF2', false, ['deriveKey']).then(weakKey => (
          // Strengthen the Pin CryptoKey by using PBKDF2
          subtle.deriveKey(deriveParams, weakKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'wrapKey'])
        )).then(strongKey => (
          // Use the Strengthened CryptoKey to wrap the secretPhrase CryptoKey
          subtle.wrapKey('jwk', secretPhraseCryptoKey, strongKey, wrapParams)
        )).then(secretPhraseJwk => (
          // Retreive the secretPhrase as a HexString
          subtle.exportKey('raw', secretPhraseCryptoKey)
            .then((secretPhraseBuffer) => {
              const secretPhraseHex = converters.byteArrayToHexString(
                Array.from(new Uint8Array(secretPhraseBuffer))
              )
              return [secretPhraseHex, secretPhraseJwk]
            })
        ))
      )).then(([secretPhraseHex, secretPhraseJwk]) => {
        // secretPhraseHex is the sha256 hash of the user's passphrase
        // secretPhraseHex is the real secretPhrase used to sign transactions
        // secretPhraseJwk is the encrypted secretPhrase in 'jwk' format
        const publicKey = NRS.generatePublicKey(secretPhraseHex)
        const accountId = NRS.getAccountIdFromPublicKey(publicKey)
        const accountRS = NRS.convertNumericToRSAccountFormat(accountId)

        // Store account in browser's indexedDB
        const accountNo = accountId
        const address = accountRS
        const dbKey = address
        callOnStore('accounts', (store) => {
          store.put({
            id: dbKey,
            platform,
            accountNo,
            address,
            publicKey,
            secretPhrase: {
              format: 'jwk',
              key: secretPhraseJwk,
              keyAlgo,
              deriveParams,
              unwrapParams: wrapParams,
            },
            createdAt: new Date(),
            lastUsedAt: null,
          })
        })
        callback(null, {
          address,
          accountNo,
          publicKey,
        })
      }).catch(error => callback(error)) // eslint-disable-line newline-per-chained-call
    },
    signTransaction: (address, secretPin, txType, txData, callback) => {
      if (typeof address !== 'string') throw new Error('address is not a string')
      if (typeof secretPin !== 'string') throw new Error('secretPin is not a string')
      if (typeof txType !== 'string') throw new Error('txType is not a string')
      if (typeof txData !== 'object') throw new Error('txData is not an object')

      const secretPinBytes = converters.stringToByteArray(secretPin)

      // Get account from  browser's indexedDB
      const dbKey = address
      callOnStore('accounts', (store) => {
        const req = store.get(dbKey)
        req.onerror = err => callback(err)
        req.onsuccess = () => {
          if (!req.result) callback(new Error('account dbKey is not found in this browser'))
          if (!req.result.secretPhrase) callback(new Error('account secretPhrase is not stored in this browser'))
          // const { format, key, keyAlgo, unwrapParams, deriveParams } = req.result.secretPhrase
          const secretPhraseObj = req.result.secretPhrase

          // TODO: Update the lastUsedAt timestamp

          // Unwrap the wrapped secretPhrase object
          unwrapSecretPhrase(secretPinBytes, secretPhraseObj)
            .then(secretPhraseUint8 => converters.byteArrayToHexString(
              Array.from(secretPhraseUint8)
            ))
            .then((secretPhraseHex) => {
              // secretPhraseHex is the sha256 hash of the user's passphrase
              const data = {
                ...fixTxNumberFormat(txData),
                broadcast: 'false',
                secretPhrase: secretPhraseHex,
                ...NRS.getMandatoryParams(),
              }
              // Use NRS bridge to sign the transaction data
              NRS.sendRequest(txType, data, (signResponse) => {
                callback(null, {
                  signResponse,
                })
              })
            })
            .catch(error => callback(error))
        }
      })
    },
    signMessage: (address, secretPin, message, callback) => {
      if (typeof address !== 'string') throw new Error('address is not a string')
      if (typeof secretPin !== 'string') throw new Error('secretPin is not a string')
      if (typeof message !== 'string') throw new Error('message is not a string')

      const secretPinBytes = converters.stringToByteArray(secretPin)
      const messageBytes = converters.stringToByteArray(message)

      // Get account from  browser's indexedDB
      const dbKey = address
      callOnStore('accounts', (store) => {
        const req = store.get(dbKey)
        req.onerror = err => callback(err)
        req.onsuccess = () => {
          if (!req.result) callback(new Error('account dbKey is not found in this browser'))
          if (!req.result.secretPhrase) callback(new Error('account secretPhrase is not stored in this browser'))
          // const { format, key, keyAlgo, unwrapParams, deriveParams } = req.result.secretPhrase
          const secretPhraseObj = req.result.secretPhrase

          // TODO: Update the lastUsedAt timestamp

          // Unwrap the wrapped secretPhrase object
          unwrapSecretPhrase(secretPinBytes, secretPhraseObj)
            .then(secretPhraseUint8 => converters.byteArrayToHexString(
              Array.from(secretPhraseUint8)
            ))
            .then((secretPhraseHex) => {
              const signature = NRS.signBytes(
                messageBytes,
                converters.stringToHexString(secretPhraseHex),
              )
              callback(null, { signature })
            })
            .catch(error => callback(error))
        }
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

  // methods.createKeyPair('secret here', 'pin123456', (err, res) => {
  //   console.log(err, res)
  // })
})
