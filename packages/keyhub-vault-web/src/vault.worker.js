'use strict'

global.isNode = true
const { NrsBridge, converters } = require('keyhub-vault-nxt')

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

const nxtConfig = require('./conf/eqh/nxt')
const nxtConstants = require('./conf/eqh/constants')

const PRIVATE_KEY_LENGTH = 256

log('Loading NRS-bridge...')

const bridge = new NrsBridge(nxtConfig)

bridge.load(NRS => {
  NRS.processConstants(nxtConstants)

  log('Loaded NRS-bridge.')

  const fixTxNumberFormat = tx => {
    const { accountRS, recipientRS, assetId, amount, decimals, quantity, price, ...txData } = tx

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

  const getKeyInfo = secretPhrase => {
    const publicKey = NRS.getPublicKey(secretPhrase)
    const accountNo = NRS.getAccountIdFromPublicKey(publicKey)
    const address = NRS.convertNumericToRSAccountFormat(accountNo)
    return { publicKey, accountNo, address }
  }

  const createKeyPair = (passphraseUint8, cryptoKeyOrPin, opts) =>
    // Hash the passphrase to get the nxt secretPhrase
    digest(passphraseUint8, { name: 'SHA-384' })
      .then(secretPhraseBuffer => {
        // Note: Non-truncated SHA is vulnerable to length extension attack (e.g. sha256 & sha512)
        // We use a longer hash here and truncate to desired AES keySize (e.g. 256)
        const secretPhraseUint8 = new Uint8Array(secretPhraseBuffer, 0, PRIVATE_KEY_LENGTH / 8)
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
        const { publicKey, address, accountNo } = getKeyInfo(secretPhraseHex)

        // Store key in browser's indexedDB
        return new Promise((resolve, reject) => {
          const entry = {
            id: address,
            platform: 'EquineHub',
            publicKey,
            address,
            accountNo,
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

  const storePassphrase = (entryId, passphraseImage, cryptoKey) => {
    // Encrypt the cleardata of the passphraseImage
    const encryptAlgo = { name: 'AES-GCM', iv: genInitVector() }
    return encrypt(passphraseImage.data, cryptoKey, encryptAlgo).then(
      cipherdataBuffer =>
        new Promise((resolve, reject) => {
          // Store encrypted passphrase image in browser's indexedDB
          callOnStore('accounts', accounts => {
            const req = accounts.get(entryId)
            req.onerror = err => reject(err)
            req.onsuccess = ({ target: { result: entry } }) => {
              if (!entry) {
                reject(new Error('key is missing in this browser'))
                return
              }
              entry.passphraseImage = {
                encryptData: cipherdataBuffer,
                encryptAlgo,
                width: passphraseImage.width,
                height: passphraseImage.height,
              }
              const req2 = accounts.put(entry)
              req2.onerror = err => reject(err)
              req2.onsuccess = () => {
                resolve(entry)
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

          if (entry.passphraseImage) {
            // Decrypt the plaintext passphrase
            const { encryptData, encryptAlgo, width, height } = entry.passphraseImage
            decrypt(encryptData, cryptoKey, encryptAlgo)
              .then(cleardataBuffer =>
                resolve({
                  data: new Uint8ClampedArray(cleardataBuffer),
                  width,
                  height,
                })
              )
              .catch(reject)
          } else {
            reject(new Error('key passphrase is not available'))
          }
        }
      })
    })

  const methods = safeObj({
    configure: config => {
      if (typeof config !== 'object') throw new Error('config is not an object')

      if (config.address !== undefined) {
        const { address, ...conf } = config
        conf.accountRS = address
        bridge.configure(conf)
      } else {
        bridge.configure(config)
      }
      return { config }
    },
    generatePassphrase: wordcount => {
      const randomWords = dicewareGen({
        language: wordlistEnEff,
        wordcount: +wordcount || 10,
        format: 'array',
      })
      const passphrase = randomWords.join(' ')

      return passphrase
    },
    getPassphraseInfo: passphrase => {
      const passphraseUint8 = Uint8Array.from(converters.stringToByteArray(passphrase))
      // Hash the passphrase to get the nxt secretPhrase
      return digest(passphraseUint8, { name: 'SHA-384' }).then(secretPhraseBuffer => {
        // Note: Non-truncated SHA is vulnerable to length extension attack (e.g. sha256 & sha512)
        // We use a longer hash here and truncate to desired AES keySize (e.g. 256)
        const secretPhraseUint8 = new Uint8Array(secretPhraseBuffer, 0, PRIVATE_KEY_LENGTH / 8)
        const secretPhraseHex = converters.byteArrayToHexString(Array.from(secretPhraseUint8))
        return getKeyInfo(secretPhraseHex)
      })
    },
    getStoredKeyInfo: entryId => {
      if (typeof entryId !== 'string') throw new Error('address / entryId is not a string')

      // Get key from browser's indexedDB
      return new Promise((resolve, reject) => {
        callOnStore('accounts', accounts => {
          const req = accounts.get(entryId)
          req.onerror = err => reject(err)
          req.onsuccess = ({ target: { result: entry } }) => {
            if (!entry) {
              reject(new Error('key is missing in this browser'))
            } else {
              resolve({
                address: entry.address,
                accountNo: entry.accountNo,
                publicKey: entry.publicKey,
                createdAt: entry.createdAt,
                hasPassphrase: !!entry.passphraseImage,
              })
            }
          }
        })
      })
    },
    getStoredKeyPassphrase: entryId => {
      if (typeof entryId !== 'string') throw new Error('address / entryId is not a string')

      // Get masterkey from browser's indexedDB
      return new Promise((resolve, reject) => {
        callOnStore('prefs', prefs => {
          const req = prefs.get('masterkey')
          req.onerror = err => reject(err)
          req.onsuccess = ({ target: { result: masterCryptoKey } }) => {
            if (!masterCryptoKey) {
              reject(new Error('vault masterKey is missing in this browser'))
              return
            }

            retrievePassphrase(entryId, masterCryptoKey)
              .then(resolve)
              .catch(reject)
          }
        })
      })
    },
    storeUnprotectedKey: (passphrase, passphraseImage) => {
      if (typeof passphrase !== 'string') throw new Error('passphrase is not a string')
      // eslint-disable-next-line no-undef
      if (passphraseImage && !(passphraseImage instanceof ImageData))
        throw new Error('passphraseImage is not an ImageData')

      const passphraseUint8 = Uint8Array.from(converters.stringToByteArray(passphrase))

      const keyAlgo = {
        name: 'AES-GCM',
        length: PRIVATE_KEY_LENGTH,
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
      return new Promise((resolve, reject) => {
        callOnStore('prefs', prefs => {
          const req = prefs.get('masterkey')
          req.onerror = err => reject(err)
          req.onsuccess = ({ target: { result: entry } }) => {
            if (entry) {
              const masterCryptoKey = entry
              createKeyPair(passphraseUint8, masterCryptoKey, opts)
                .then(keyInfo => {
                  if (!passphraseImage) {
                    resolve(keyInfo)
                  } else {
                    storePassphrase(keyInfo.id, passphraseImage, masterCryptoKey).then(() =>
                      resolve(keyInfo)
                    )
                  }
                })
                .catch(reject)
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
                  return createKeyPair(passphraseUint8, masterCryptoKey, opts).then(keyInfo => {
                    if (!passphraseImage) {
                      resolve(keyInfo)
                    } else {
                      storePassphrase(keyInfo.id, passphraseImage, masterCryptoKey).then(() =>
                        resolve(keyInfo)
                      )
                    }
                  })
                })
                .catch(reject)
            }
          }
        })
      })
    },
    storeProtectedKey: (passphrase, secretPin) => {
      if (typeof passphrase !== 'string') throw new Error('passphrase is not a string')
      if (typeof secretPin !== 'string') throw new Error('secretPin is not a string')

      const passphraseUint8 = Uint8Array.from(converters.stringToByteArray(passphrase))
      const secretPinUint8 = Uint8Array.from(converters.stringToByteArray(secretPin))

      const keyAlgo = {
        name: 'AES-GCM',
        length: PRIVATE_KEY_LENGTH,
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

      return createKeyPair(passphraseUint8, secretPinUint8, opts)
    },
    signTransaction: (entryId, secretPin, txType, txData) => {
      if (typeof entryId !== 'string') throw new Error('address / entryId is not a string')
      if (typeof secretPin !== 'string') throw new Error('secretPin is not a string')
      if (typeof txType !== 'string') throw new Error('txType is not a string')
      if (typeof txData !== 'object') throw new Error('txData is not an object')

      const secretPinBytes = converters.stringToByteArray(secretPin)
      const secretPinUint8 = Uint8Array.from(secretPinBytes)

      // Get key from  browser's indexedDB
      return new Promise((resolve, reject) => {
        callOnStore('accounts', accounts => {
          const req = accounts.get(entryId)
          req.onerror = err => reject(err)
          req.onsuccess = ({ target: { result: entry } }) => {
            if (!entry) {
              reject(new Error('key is missing in this browser'))
              return
            }
            if (!entry.secretPhrase) {
              reject(new Error('key secretPhrase is not stored in this browser'))
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
                  if (errorCode) reject(new Error(errorDescription))
                  resolve({
                    transactionJSON,
                    transactionBytes,
                    transactionFullHash: fullHash,
                  })
                })
              })
              .catch(reject)
          }
        })
      })
    },
    signMessage: (entryId, messageHex, secretPin) => {
      if (typeof entryId !== 'string') throw new Error('address / entryId is not a string')
      if (typeof messageHex !== 'string') throw new Error('message is not a hex string')

      // const messageHex = converters.stringToHexString(message)

      // Get key from  browser's indexedDB
      return new Promise((resolve, reject) => {
        callOnStore('accounts', accounts => {
          const req = accounts.get(entryId)
          req.onerror = err => reject(err)
          req.onsuccess = ({ target: { result: entry } }) => {
            if (!entry) {
              reject(new Error('key is missing in this browser'))
              return
            }
            if (!entry.secretPhrase) {
              reject(new Error('key secretPhrase is not stored in this browser'))
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
                  resolve({ signature })
                })
                .catch(reject)
            } else {
              // Get masterkey from browser's indexedDB
              callOnStore('prefs', prefs => {
                const req2 = prefs.get('masterkey')
                req2.onerror = err => reject(err)
                req2.onsuccess = ({ target: { result: masterCryptoKey } }) => {
                  if (!masterCryptoKey) {
                    reject(new Error('vault masterKey is missing in this browser'))
                    return
                  }

                  unwrapKey(masterCryptoKey, secretPhraseObj)
                    .then(secretPhraseBuffer => {
                      const secretPhraseUint8 = new Uint8Array(secretPhraseBuffer)
                      return converters.byteArrayToHexString(Array.from(secretPhraseUint8))
                    })
                    .then(secretPhraseHex => {
                      const signature = NRS.signBytes(messageHex, secretPhraseHex)
                      resolve({ signature })
                    })
                    .catch(reject)
                }
              })
            }
          }
        })
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
      // const safeParams = params.filter(p =>
      //   ['number', 'string', 'boolean', 'undefined', 'object'].includes(typeof p)
      // )
      if (!(name in methods)) {
        throw new Error('invalid method name')
      }
      try {
        Promise.resolve(methods[name](...params)).then(
          res => {
            // eslint-disable-next-line no-undef, no-restricted-globals
            self.postMessage(res)
          },
          err => {
            console.error(err) // eslint-disable-line no-console
            // eslint-disable-next-line no-undef, no-restricted-globals
            // self.postMessage({ error: JSON.stringify(err, Object.getOwnPropertyNames(err)) })
            // eslint-disable-next-line no-undef, no-restricted-globals
            self.setTimeout(() => {
              throw err
            })
          }
        )
      } catch (err) {
        console.error(err) // eslint-disable-line no-console
        // eslint-disable-next-line no-undef, no-restricted-globals
        // self.postMessage({ error: JSON.stringify(err, Object.getOwnPropertyNames(err)) })
        throw err
      }
    }
  }
})
