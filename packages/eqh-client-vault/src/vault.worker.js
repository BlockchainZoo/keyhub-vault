'use strict'

const wordlistEnEff = require('diceware-wordlist-en-eff')
const dicewareGen = require('./util/diceware')
const { callOnStore } = require('./util/indexeddb')
const {
  safeObj,
  encrypt,
  decrypt,
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

const nxtConfig = require('./conf/eqh/nxt')
const nxtConstants = require('./conf/eqh/constants')

log('Loading NRS-bridge...')

const bridge = new NrsBridge(nxtConfig)

bridge.load(NRS => {
  NRS.processConstants(nxtConstants)

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
          ? wrapKeyWithPin(secretPhraseUint8, cryptoKeyOrPin, opts)
          : wrapKey(secretPhraseUint8, cryptoKeyOrPin, opts)
      })
      .then(exportKeys) // Ensure key can be exported / extracted
      .then(([secretPhraseObj, secretPhraseBuffer]) => {
        // secretPhraseHex is the real secretPhrase used to sign transactions
        // secretPhraseJwk is the encrypted secretPhrase in 'jwk' format
        const secretPhraseUint8 = new Uint8Array(secretPhraseBuffer)
        const secretPhraseHex = converters.byteArrayToHexString(Array.from(secretPhraseUint8))
        const publicKey = NRS.getPublicKey(secretPhraseHex)
        const accountId = NRS.getAccountIdFromPublicKey(publicKey)
        const accountRS = NRS.convertNumericToRSAccountFormat(accountId)
        const address = accountRS

        // Store key in browser's indexedDB
        return new Promise((resolve, reject) => {
          const entry = {
            id: address,
            platform: 'EquineHub',
            accountNo: accountId,
            address,
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
                id: entry.id,
                address: entry.address,
                accountNo: entry.accountNo,
                publicKey: entry.publicKey,
              })
            }
          })
        })
      })

  const storePassphrase = (entryId, passphraseUint8, cryptoKey) => {
    // Encrypt the plaintext passphrase
    const encryptAlgo = { name: 'AES-GCM', iv: genInitVector() }
    return encrypt(passphraseUint8, cryptoKey, encryptAlgo).then(
      ciphertextBuffer =>
        new Promise((resolve, reject) => {
          // Store encrypted passphrase in browser's indexedDB
          callOnStore('accounts', accounts => {
            const req = accounts.get(entryId)
            req.onerror = err => reject(err)
            req.onsuccess = ({ target: { result: entry } }) => {
              if (!entry) {
                reject(new Error('key is missing in this browser'))
                return
              }
              entry.passphrase = {
                ciphertext: ciphertextBuffer,
                encryptAlgo,
              }
              const req2 = accounts.put(entry)
              req2.onerror = err => reject(err)
              req2.onsuccess = () => {
                resolve(ciphertextBuffer)
              }
            }
          })
        })
    )
  }

  const retrievePassphrase = (entryId, cryptoKey) =>
    new Promise((resolve, reject) => {
      // Retrieve encrypted passphrase in browser's indexedDB
      callOnStore('accounts', accounts => {
        const req = accounts.get(entryId)
        req.onerror = err => reject(err)
        req.onsuccess = ({ target: { result: entry } }) => {
          if (!entry) {
            reject(new Error('key is missing in this browser'))
            return
          }

          if (entry.passphrase) {
            // Decrypt the plaintext passphrase
            const { ciphertext, encryptAlgo } = entry.passphrase
            decrypt(ciphertext, cryptoKey, encryptAlgo)
              .then(plaintextBuffer => resolve(new Uint8Array(plaintextBuffer)))
              .catch(reject)
          } else {
            reject(new Error('key passphrase is not available'))
          }
        }
      })
    })

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
    getKeyPair: (entryId, callback) => {
      if (typeof entryId !== 'string') throw new Error('address / entryId is not a string')
      if (!callback) throw new Error('incorrect number of parameters')

      // Get key from browser's indexedDB
      callOnStore('accounts', accounts => {
        const req = accounts.get(entryId)
        req.onerror = err => callback(err)
        req.onsuccess = ({ target: { result: entry } }) => {
          if (!entry) {
            callback(new Error('key is missing in this browser'))
          } else {
            callback(null, {
              address: entry.address,
              accountNo: entry.accountNo,
              publicKey: entry.publicKey,
              createdAt: entry.createdAt,
              hasPassphrase: !!entry.passphrase,
            })
          }
        }
      })
    },
    getKeyPairPassphrase: (entryId, callback) => {
      if (typeof entryId !== 'string') throw new Error('address / entryId is not a string')
      if (!callback) throw new Error('incorrect number of parameters')

      // Get masterkey from browser's indexedDB
      callOnStore('prefs', prefs => {
        const req = prefs.get('masterkey')
        req.onerror = err => callback(err)
        req.onsuccess = ({ target: { result: masterCryptoKey } }) => {
          if (!masterCryptoKey) {
            callback(new Error('vault masterKey is missing in this browser'))
            return
          }

          retrievePassphrase(entryId, masterCryptoKey)
            .then(plaintextUint8 => {
              const passphrase = converters.byteArrayToString(Array.from(plaintextUint8))
              callback(null, { passphrase })
            })
            .catch(callback)
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
              .then(keyInfo =>
                storePassphrase(keyInfo.id, passphraseUint8, masterCryptoKey).then(() =>
                  callback(null, keyInfo)
                )
              )
              .catch(callback)
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
                return createKeyPair(passphraseUint8, masterCryptoKey, opts).then(keyInfo =>
                  storePassphrase(keyInfo.id, passphraseUint8, masterCryptoKey).then(() =>
                    callback(null, keyInfo)
                  )
                )
              })
              .catch(callback)
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
        .then(keyInfo => callback(null, keyInfo))
        .catch(callback)
    },
    signTransaction: (entryId, secretPin, txType, txData, callback) => {
      if (typeof entryId !== 'string') throw new Error('address / entryId is not a string')
      if (typeof secretPin !== 'string') throw new Error('secretPin is not a string')
      if (typeof txType !== 'string') throw new Error('txType is not a string')
      if (typeof txData !== 'object') throw new Error('txData is not an object')
      if (!callback) throw new Error('incorrect number of parameters')

      const secretPinBytes = converters.stringToByteArray(secretPin)
      const secretPinUint8 = Uint8Array.from(secretPinBytes)

      // Get key from  browser's indexedDB
      callOnStore('accounts', accounts => {
        const req = accounts.get(entryId)
        req.onerror = err => callback(err)
        req.onsuccess = ({ target: { result: entry } }) => {
          if (!entry) {
            callback(new Error('key is missing in this browser'))
            return
          }
          if (!entry.secretPhrase) {
            callback(new Error('key secretPhrase is not stored in this browser'))
            return
          }

          // const { format, key, keyAlgo, unwrapAlgo, deriveAlgo } = entry.secretPhrase
          const { secretPhrase: secretPhraseObj } = entry

          // TODO: Update the lastUsedAt timestamp

          // Unwrap the wrapped secretPhrase object
          unwrapKeyWithPin(secretPinUint8, secretPhraseObj)
            .then(secretPhraseBuffer => {
              const secretPhraseUint8 = new Uint8Array(secretPhraseBuffer)
              return converters.byteArrayToHexString(Array.from(secretPhraseUint8))
            })
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
            .catch(callback)
        }
      })
    },
    signMessage: (entryId, messageHex, secretPin, callback) => {
      if (typeof entryId !== 'string') throw new Error('address / entryId is not a string')
      if (typeof messageHex !== 'string') throw new Error('message is not a hex string')
      if (!callback) throw new Error('incorrect number of parameters')

      // const messageHex = converters.stringToHexString(message)

      // Get key from  browser's indexedDB
      callOnStore('accounts', accounts => {
        const req = accounts.get(entryId)
        req.onerror = err => callback(err)
        req.onsuccess = ({ target: { result: entry } }) => {
          if (!entry) {
            callback(new Error('key is missing in this browser'))
            return
          }
          if (!entry.secretPhrase) {
            callback(new Error('key secretPhrase is not stored in this browser'))
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
              .then(secretPhraseBuffer => {
                const secretPhraseUint8 = new Uint8Array(secretPhraseBuffer)
                return converters.byteArrayToHexString(Array.from(secretPhraseUint8))
              })
              .then(secretPhraseHex => {
                const signature = NRS.signBytes(messageHex, secretPhraseHex)
                callback(null, { signature })
              })
              .catch(callback)
          } else {
            // Get masterkey from browser's indexedDB
            callOnStore('prefs', prefs => {
              const req2 = prefs.get('masterkey')
              req2.onerror = err => callback(err)
              req2.onsuccess = ({ target: { result: masterCryptoKey } }) => {
                if (!masterCryptoKey) {
                  callback(new Error('vault masterKey is missing in this browser'))
                  return
                }

                unwrapKey(masterCryptoKey, secretPhraseObj)
                  .then(secretPhraseBuffer => {
                    const secretPhraseUint8 = new Uint8Array(secretPhraseBuffer)
                    return converters.byteArrayToHexString(Array.from(secretPhraseUint8))
                  })
                  .then(secretPhraseHex => {
                    const signature = NRS.signBytes(messageHex, secretPhraseHex)
                    callback(null, { signature })
                  })
                  .catch(callback)
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
})
