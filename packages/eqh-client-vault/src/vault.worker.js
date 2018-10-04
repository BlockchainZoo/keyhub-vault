'use strict'

const wordlistEnEff = require('diceware-wordlist-en-eff')
const dicewareGen = require('./util/diceware')
const { callOnStore } = require('./util/indexeddb')
const {
  safeObj,
  encrypt,
  digest,
  wrapKey,
  wrapKeyWithPin,
  unwrapKey,
  unwrapKeyWithPin,
  genInitVector,
  genDeriveAlgo,
  exportKeys,
  subtle,
} = require('./util/crypto')

const log = (...args) => console.log(JSON.stringify(args, null, '  ')) // eslint-disable-line no-console

const { NrsBridge } = require('./js/nrs.cheerio.bridge')

global.isNode = true
const converters = require('./js/util/converters')

const nxtConfig = require('./conf/nxt.json')

log('Loading NRS-bridge...')

const bridge = new NrsBridge(nxtConfig)

bridge.load(NRS => {
  log('Loaded NRS-bridge.')

  const fixTxNumberFormat = ({
    accountRS,
    recipientRS,
    assetId,
    amount,
    decimals,
    quantity,
    price,
    ...txData
  }) => {
    /* eslint-disable no-param-reassign */
    if (amount !== undefined) txData.amountNQT = NRS.convertToNQT(amount)
    if (decimals !== undefined) {
      if (quantity) txData.quantityQNT = NRS.convertToQNT(quantity, decimals)
      if (price) txData.priceNQT = NRS.calculatePricePerWholeQNT(NRS.convertToNQT(price), decimals)
    }

    if (recipientRS) txData.recipient = NRS.convertRSToNumericAccountFormat(recipientRS)
    if (accountRS) txData.account = NRS.convertRSToNumericAccountFormat(accountRS)
    if (assetId !== undefined) txData.asset = assetId

    return txData
  }

  const createKeyPair = (passphraseUint8, cryptoKeyOrPin, opts) =>
    // Hash the passphrase to get the nxt secretPhrase
    digest(passphraseUint8, { name: 'SHA-384' })
      .then(secretPhraseBuffer => {
        // Note: Non-truncated SHA is vulnerable to length extension attack (e.g. sha256 & sha512)
        // We use a longer hash here and truncate to desired AES keySize
        const secretPhraseUint8 = new Uint8Array(secretPhraseBuffer, 0, opts.keyAlgo.length / 8)
        return cryptoKeyOrPin instanceof Uint8Array
          ? wrapKeyWithPin(cryptoKeyOrPin, secretPhraseUint8, opts)
          : wrapKey(cryptoKeyOrPin, secretPhraseUint8, opts)
      })
      .then(exportKeys) // Ensure key can be exported / extracted
      .then(([secretPhraseObj, secretPhraseUint8]) => {
        // secretPhraseHex is the real secretPhrase used to sign transactions
        // secretPhraseJwk is the encrypted secretPhrase in 'jwk' format
        const secretPhraseHex = converters.byteArrayToHexString(Array.from(secretPhraseUint8))
        const publicKey = NRS.getPublicKey(secretPhraseHex)
        const accountId = NRS.getAccountIdFromPublicKey(publicKey)
        const accountRS = NRS.convertNumericToRSAccountFormat(accountId)

        // Store account in browser's indexedDB
        return new Promise((resolve, reject) => {
          const entry = {
            id: accountRS,
            platform: 'EquineHub',
            accountNo: accountId,
            address: accountRS,
            publicKey,
            secretPhrase: secretPhraseObj,
            createdAt: new Date(),
            lastUsedAt: null,
          }
          callOnStore('accounts', accounts => {
            const req = accounts.put(entry)
            req.onerror = err => reject(err)
            req.onsuccess = () => {
              resolve({
                address: entry.address,
                accountNo: entry.accountNo,
                publicKey: entry.publicKey,
                createdAt: entry.createdAt,
              })
            }
          })
        })
      })

  const storePassphrase = (passphraseUint8, cryptoKey, accountInfo) =>
    // Encrypt the plaintext passphrase
    encrypt(cryptoKey, passphraseUint8, { name: 'AES-GCM', iv: genInitVector() }).then(
      ciphertextBuffer =>
        // Store encrypted passphrase in browser's indexedDB
        new Promise((resolve, reject) => {
          const { address: dbKey } = accountInfo
          callOnStore('accounts', accounts => {
            const req = accounts.get(dbKey)
            req.onerror = err => reject(err)
            req.onsuccess = ({ target: { result: entry } }) => {
              if (!entry) {
                reject(new Error('account dbKey is not found in this browser'))
                return
              }
              entry.encryptedPassphrase = ciphertextBuffer
              const req2 = accounts.put(entry)
              req2.onerror = err => reject(err)
              req2.onsuccess = () => {
                resolve(accountInfo)
              }
            }
          })
        })
    )

  const methods = safeObj({
    configure: (config, callback) => {
      if (typeof config !== 'object') throw new Error('config is not an object')
      if (!callback) throw new Error('incorrect number of parameters')

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
    getKeyPair: (address, callback) => {
      if (typeof address !== 'string') throw new Error('address is not a string')
      if (!callback) throw new Error('incorrect number of parameters')

      // Get account from browser's indexedDB
      const dbKey = address
      callOnStore('accounts', accounts => {
        const req = accounts.get(dbKey)
        req.onerror = err => callback(err)
        req.onsuccess = ({ target: { result: entry } }) => {
          if (!entry) {
            callback(null, {})
          } else {
            callback(null, {
              address: entry.address,
              accountNo: entry.accountNo,
              publicKey: entry.publicKey,
              createdAt: entry.createdAt,
            })
          }
        }
      })
    },
    createUnprotectedKeyPair: (passphrase, callback) => {
      if (typeof passphrase !== 'string') throw new Error('passphrase is not a string')
      if (!callback) throw new Error('incorrect number of parameters')

      const passphraseUint8 = Uint8Array.from(converters.stringToByteArray(passphrase))

      const keyAlgo = {
        name: 'AES-GCM',
        length: 256,
      }

      const opts = {
        format: 'jwk',
        keyAlgo,
        wrapAlgo: {
          name: keyAlgo.name,
          iv: genInitVector(),
        },
      }

      // Get masterkey from browser's indexedDB
      callOnStore('prefs', prefs => {
        const req = prefs.get('masterkey')
        req.onerror = err => callback(err)
        req.onsuccess = ({ target: { result: entry } }) => {
          if (entry) {
            const masterCryptoKey = entry
            createKeyPair(passphraseUint8, masterCryptoKey, opts)
              .then(accountInfo => storePassphrase(passphraseUint8, masterCryptoKey, accountInfo))
              .then(accountInfo => callback(null, accountInfo))
              .catch(error => callback(error))
          } else {
            // masterkey should be non-extractable (i.e. cannot be used in exportKey)
            const masterKeyExtractable = false
            const masterKeyUsages = ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
            subtle
              .generateKey(safeObj(keyAlgo), masterKeyExtractable, masterKeyUsages)
              .then(masterCryptoKey => {
                callOnStore('prefs', p => {
                  p.put(masterCryptoKey, 'masterkey')
                })
                return createKeyPair(passphraseUint8, masterCryptoKey, opts)
                  .then(accountInfo =>
                    storePassphrase(passphraseUint8, masterCryptoKey, accountInfo)
                  )
                  .then(accountInfo => callback(null, accountInfo))
              })
              .catch(error => callback(error))
          }
        }
      })
    },
    createProtectedKeyPair: (passphrase, secretPin, callback) => {
      if (typeof passphrase !== 'string') throw new Error('passphrase is not a string')
      if (typeof secretPin !== 'string') throw new Error('secretPin is not a string')
      if (!callback) throw new Error('incorrect number of parameters')

      const passphraseUint8 = Uint8Array.from(converters.stringToByteArray(passphrase))
      const secretPinUint8 = Uint8Array.from(converters.stringToByteArray(secretPin))

      const keyAlgo = {
        name: 'AES-GCM',
        length: 256,
      }

      const opts = {
        format: 'jwk',
        keyAlgo,
        wrapAlgo: {
          name: 'AES-GCM',
          iv: genInitVector(),
        },
        deriveAlgo: genDeriveAlgo(),
      }

      createKeyPair(passphraseUint8, secretPinUint8, opts)
        .then(accountInfo => callback(null, accountInfo))
        .catch(error => callback(error))
    },
    signTransaction: (address, secretPin, txType, txData, callback) => {
      if (typeof address !== 'string') throw new Error('address is not a string')
      if (typeof secretPin !== 'string') throw new Error('secretPin is not a string')
      if (typeof txType !== 'string') throw new Error('txType is not a string')
      if (typeof txData !== 'object') throw new Error('txData is not an object')
      if (!callback) throw new Error('incorrect number of parameters')

      const secretPinBytes = converters.stringToByteArray(secretPin)
      const secretPinUint8 = Uint8Array.from(secretPinBytes)

      // Get account from  browser's indexedDB
      const dbKey = address
      callOnStore('accounts', accounts => {
        const req = accounts.get(dbKey)
        req.onerror = err => callback(err)
        req.onsuccess = ({ target: { result: entry } }) => {
          if (!entry) {
            callback(new Error('account dbKey is not found in this browser'))
            return
          }
          if (!entry.secretPhrase) {
            callback(new Error('account secretPhrase is not stored in this browser'))
            return
          }

          // const { format, key, keyAlgo, unwrapAlgo, deriveAlgo } = entry.secretPhrase
          const { secretPhrase: secretPhraseObj } = entry

          // TODO: Update the lastUsedAt timestamp

          // Unwrap the wrapped secretPhrase object
          unwrapKeyWithPin(secretPinUint8, secretPhraseObj)
            .then(secretPhraseUint8 =>
              converters.byteArrayToHexString(Array.from(secretPhraseUint8))
            )
            .then(secretPhraseHex => {
              // secretPhraseHex is the sha256 hash of the user's passphrase
              const data = safeObj({
                ...fixTxNumberFormat(txData),
                broadcast: 'false',
                secretPhraseHex,
                ...NRS.getMandatoryParams(),
              })
              // Use NRS bridge to sign the transaction data
              NRS.sendRequest(txType, data, res => {
                const {
                  errorCode,
                  errorDescription,
                  transactionJSON,
                  transactionBytes,
                  fullHash,
                } = res
                if (errorCode) callback(new Error(errorDescription))
                callback(null, {
                  transactionJSON,
                  transactionBytes,
                  transactionFullHash: fullHash,
                })
              })
            })
            .catch(error => callback(error))
        }
      })
    },
    signMessage: (address, messageHex, secretPin, callback) => {
      if (typeof address !== 'string') throw new Error('address is not a string')
      if (typeof messageHex !== 'string') throw new Error('message is not a hex string')
      if (!callback) throw new Error('incorrect number of parameters')

      // const messageHex = converters.stringToHexString(message)

      // Get account from  browser's indexedDB
      const dbKey = address
      callOnStore('accounts', accounts => {
        const req = accounts.get(dbKey)
        req.onerror = err => callback(err)
        req.onsuccess = ({ target: { result: entry } }) => {
          if (!entry) {
            callback(new Error('account dbKey is not found in this browser'))
            return
          }
          if (!entry.secretPhrase) {
            callback(new Error('account secretPhrase is not stored in this browser'))
            return
          }

          // const { format, key, keyAlgo, unwrapAlgo, deriveAlgo } = entry.secretPhrase
          const { secretPhrase: secretPhraseObj } = entry

          // TODO: Update the lastUsedAt timestamp

          if (secretPhraseObj.deriveAlgo) {
            if (typeof secretPin !== 'string') throw new Error('secretPin is not a string')

            const secretPinBytes = converters.stringToByteArray(secretPin)
            const secretPinUint8 = Uint8Array.from(secretPinBytes)

            // Unwrap the wrapped secretPhrase object
            unwrapKeyWithPin(secretPinUint8, secretPhraseObj)
              .then(secretPhraseUint8 =>
                converters.byteArrayToHexString(Array.from(secretPhraseUint8))
              )
              .then(secretPhraseHex => {
                const signature = NRS.signBytes(messageHex, secretPhraseHex)
                callback(null, { signature })
              })
              .catch(error => callback(error))
          } else {
            // Get masterkey from browser's indexedDB
            callOnStore('prefs', prefs => {
              const req2 = prefs.get('masterkey')
              req2.onerror = err => callback(err)
              req2.onsuccess = ({ target: { result: masterCryptoKey } }) => {
                if (!masterCryptoKey) {
                  callback(new Error('vault masterKey is not found in this browser'))
                  return
                }

                unwrapKey(masterCryptoKey, secretPhraseObj)
                  .then(secretPhraseUint8 =>
                    converters.byteArrayToHexString(Array.from(secretPhraseUint8))
                  )
                  .then(secretPhraseHex => {
                    const signature = NRS.signBytes(messageHex, secretPhraseHex)
                    callback(null, { signature })
                  })
                  .catch(error => {
                    callback(error)
                  })
              }
            })
          }
        }
      })
    },
  })

  // eslint-disable-next-line no-restricted-globals
  if (typeof self !== 'undefined') {
    // eslint-disable-next-line no-restricted-globals, no-undef
    self.onmessage = event => {
      const {
        data: [name, ...params],
      } = event
      const safeParams = params.filter(p =>
        ['number', 'string', 'boolean', 'object', 'undefined'].includes(typeof p)
      )
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
