'use strict'

const log = (...args) => {
  /* eslint-disable no-console */
  // eslint-disable-next-line no-restricted-globals, no-undef
  const name = (self && self.name) || 'VaultWorker'

  if (typeof console !== 'undefined' && console.log)
    console.log(`${name}:`, ...args.map(arg => JSON.stringify(arg, null, '  ')))
}

log('Loading...')

global.isNode = true
const { NrsBridge, converters } = require('@keyhub/keyhub-vault-nxt')

const wordlistEnEff = require('diceware-wordlist-en-eff')
const dicewareGen = require('./util/diceware')

const { normalizeMessage: normalizeMsg } = require('./util/webworker')
const { callOnStore } = require('./util/indexeddb')
const {
  safeObj,
  encrypt,
  decrypt,
  digestKeyed,
  wrapKey,
  wrapKeyWithPin,
  unwrapKey,
  unwrapKeyWithPin,
  genInitVector,
  genDeriveAlgo,
  exportKeys,
  subtle,
} = require('./util/crypto')

const PRIVATE_KEY_LENGTH = 256

log('Bridge init...')

const bridge = new NrsBridge()
bridge.load()

log('Bridge ready')

const NRS = bridge.client

// Helper function to get key info of a provided secretPhrase
const getKeyInfo = secretPhraseHex => {
  const publicKey = NRS.getPublicKey(secretPhraseHex)
  const accountNo = NRS.getAccountIdFromPublicKey(publicKey)
  const address = NRS.convertNumericToRSAccountFormat(accountNo)
  return { publicKey, accountNo, address }
}

// Helper function to create and store a new Key
const storeKey = (networkName, passphraseUint8, cryptoKeyOrPin, opts) => {
  // See: https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
  const digestKeyUint8 = Uint8Array.from(converters.stringToByteArray(`${networkName} seed`))
  // Hash the seed passphrase to get the nxt masterPhrase
  return digestKeyed(digestKeyUint8, passphraseUint8, { name: 'SHA-512' })
    .then(digestBuffer => {
      // Note: Non-truncated SHA is vulnerable to length extension attack (e.g. sha256 & sha512)
      // We use a longer hash here and truncate to desired AES keySize (e.g. 256)
      const masterPhraseUint8 = new Uint8Array(digestBuffer, 0, PRIVATE_KEY_LENGTH / 8)
      // const chainCodeUint8 = new Uint8Array(digestBuffer, PRIVATE_KEY_LENGTH / 8)
      return cryptoKeyOrPin instanceof Uint8Array
        ? wrapKeyWithPin(masterPhraseUint8, cryptoKeyOrPin, opts)
        : wrapKey(masterPhraseUint8, cryptoKeyOrPin, opts)
    })
    .then(exportKeys) // Ensure key can be exported / extracted
    .then(([masterPhraseObj, masterPhraseBuffer]) => {
      // masterPhrase is the real privateKey used to sign transactions
      const masterPhraseUint8 = new Uint8Array(masterPhraseBuffer)
      const masterPhraseHex = converters.byteArrayToHexString(Array.from(masterPhraseUint8))
      const { publicKey, address, accountNo } = getKeyInfo(masterPhraseHex)

      // Store key in browser's indexedDB
      return new Promise((resolve, reject) => {
        const entry = {
          id: address,
          network: networkName,
          publicKey,
          address,
          accountNo,
          masterPhrase: masterPhraseObj,
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
}

// Helper function to store seed passphrase
const storePassphrase = (entryId, passphraseImage, cryptoKey) => {
  // Encrypt the cleardata of the seed passphraseImage
  const encryptAlgo = { name: 'AES-GCM', iv: genInitVector() }
  return encrypt(passphraseImage.data, cryptoKey, encryptAlgo).then(
    cipherdataBuffer =>
      new Promise((resolve, reject) => {
        // Store encrypted seed passphrase image in browser's indexedDB
        callOnStore('accounts', accounts => {
          const req = accounts.get(entryId)
          req.onerror = err => reject(err)
          req.onsuccess = ({ target: { result: entry } }) => {
            if (!entry) {
              reject(new Error('key is missing in this browser'))
              return
            }
            // eslint-disable-next-line no-param-reassign
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

// Helper function to retrieve seed passphrase
const retrievePassphrase = (entryId, cryptoKey) =>
  new Promise((resolve, reject) => {
    // Retrieve encrypted seed passphrase in browser's indexedDB
    callOnStore('accounts', accounts => {
      const req = accounts.get(entryId)
      req.onerror = err => reject(err)
      req.onsuccess = ({ target: { result: entry } }) => {
        if (!entry) {
          reject(new Error('key is missing in this browser'))
          return
        }

        if (entry.passphraseImage) {
          // Decrypt the seed passphrase
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

// Helper function to convert transaction data to correct numerical format
const fixTxNumberFormat = tx => {
  const { accountRS, recipientRS, assetId, amount, quantity, price, decimals = 0, ...txData } = tx

  /* eslint-disable no-param-reassign */
  if (amount !== undefined) txData.amountNQT = NRS.convertToNQT(amount)
  if (quantity !== undefined) txData.quantityQNT = NRS.convertToQNT(quantity, decimals)
  if (price !== undefined)
    txData.priceNQT = NRS.calculatePricePerWholeQNT(NRS.convertToNQT(price), decimals)

  if (recipientRS !== undefined) txData.recipient = NRS.convertRSToNumericAccountFormat(recipientRS)
  if (accountRS !== undefined) txData.account = NRS.convertRSToNumericAccountFormat(accountRS)
  if (assetId !== undefined) txData.asset = assetId

  return txData
}

// Helper function to convert transaction from json data to binary format
const encodeTransactionBytes = (txType, txData, secretPhraseHex) => {
  const data = safeObj({
    ...fixTxNumberFormat(txData),
    broadcast: 'false',
    secretPhraseHex,
    ...NRS.getMandatoryParams(),
  })

  // Set current account in NRS bridge
  const { address } = getKeyInfo(secretPhraseHex)
  NrsBridge.setCurrentAccount(address, NRS)
  // bridge.configure({ accountRS: address })

  // Use NRS bridge to sign the transaction data
  return new Promise((resolve, reject) => {
    NRS.sendRequest(txType, data, res => {
      if (res.errorCode) reject(new Error(res.errorDescription))
      resolve(res)
    })
  })
}

// Map of handlers for each method
const methods = safeObj({
  configure: conf => {
    if (typeof conf !== 'object') throw new Error('config is not an object')

    const { networkName, address, ...config } = conf
    if (address) config.accountRS = address

    if (typeof networkName === 'string') {
      // See: https://webpack.js.org/guides/dependency-management/#require-with-expression
      let networkConfig
      let networkConstants

      const networkNameLc = String.prototype.toLowerCase.call(networkName)
      try {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        networkConfig = require(`./conf/${networkNameLc}/nxt`)
      } catch (error) {
        throw new Error('Network configuration not found')
      }

      try {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        networkConstants = require(`./conf/${networkNameLc}/constants`)
      } catch (error) {
        throw new Error('Network constants not found')
      }

      bridge.configure({ ...networkConfig, ...config, constants: networkConstants })
    } else {
      bridge.configure(config)
    }

    return bridge.options
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
  getPassphraseInfo: (networkName, passphrase) => {
    // See: https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
    const digestKeyUint8 = Uint8Array.from(converters.stringToByteArray(`${networkName} seed`))
    const passphraseUint8 = Uint8Array.from(converters.stringToByteArray(passphrase))
    // Hash the passphrase to get the nxt masterPhrase
    return digestKeyed(digestKeyUint8, passphraseUint8, { name: 'SHA-512' }).then(digestBuffer => {
      // Note: Non-truncated SHA is vulnerable to length extension attack (e.g. sha256 & sha512)
      // We use a longer hash here and truncate to desired AES keySize (e.g. 256)
      const masterPhraseUint8 = new Uint8Array(digestBuffer, 0, PRIVATE_KEY_LENGTH / 8)
      // const chainCodeUint8 = new Uint8Array(digestBuffer, PRIVATE_KEY_LENGTH / 8)
      const masterPhraseHex = converters.byteArrayToHexString(Array.from(masterPhraseUint8))
      return getKeyInfo(masterPhraseHex)
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
              hasPinProtection: !!(entry.masterPhrase && entry.masterPhrase.deriveAlgo),
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
        req.onsuccess = ({ target: { result: defaultCryptoKey } }) => {
          if (!defaultCryptoKey) {
            reject(new Error('vault masterKey is missing in this browser'))
            return
          }

          retrievePassphrase(entryId, defaultCryptoKey)
            .then(resolve)
            .catch(reject)
        }
      })
    })
  },
  storeUnprotectedKey: (networkName, passphrase, passphraseImage) => {
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
            const defaultCryptoKey = entry
            storeKey(networkName, passphraseUint8, defaultCryptoKey, opts)
              .then(keyInfo => {
                if (!passphraseImage) {
                  resolve(keyInfo)
                } else {
                  storePassphrase(keyInfo.id, passphraseImage, defaultCryptoKey).then(() =>
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
              .then(defaultCryptoKey => {
                callOnStore('prefs', p => {
                  p.put(defaultCryptoKey, 'masterkey')
                })
                return storeKey(networkName, passphraseUint8, defaultCryptoKey, opts).then(
                  keyInfo => {
                    if (!passphraseImage) {
                      resolve(keyInfo)
                    } else {
                      storePassphrase(keyInfo.id, passphraseImage, defaultCryptoKey).then(() =>
                        resolve(keyInfo)
                      )
                    }
                  }
                )
              })
              .catch(reject)
          }
        }
      })
    })
  },
  storeProtectedKey: (networkName, passphrase, masterPin) => {
    if (typeof passphrase !== 'string') throw new Error('passphrase is not a string')
    if (typeof masterPin !== 'string') throw new Error('masterPin is not a string')

    const passphraseUint8 = Uint8Array.from(converters.stringToByteArray(passphrase))
    const masterPinUint8 = Uint8Array.from(converters.stringToByteArray(masterPin))

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

    return storeKey(networkName, passphraseUint8, masterPinUint8, opts)
  },
  signTransaction: (entryId, txType, txData, masterPin) => {
    if (typeof entryId !== 'string') throw new Error('address / entryId is not a string')
    if (typeof masterPin !== 'string') throw new Error('masterPin is not a string')
    if (typeof txType !== 'string') throw new Error('txType is not a string')
    if (typeof txData !== 'object') throw new Error('txData is not an object')

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
          if (!entry.masterPhrase) {
            reject(new Error('key masterPhrase is not stored in this browser'))
            return
          }

          // const { format, key, keyAlgo, unwrapAlgo, deriveAlgo } = entry.masterPhrase
          const { masterPhrase: masterPhraseObj } = entry

          // TODO: Update the lastUsedAt timestamp

          if (masterPhraseObj.deriveAlgo) {
            if (typeof masterPin !== 'string') throw new Error('masterPin is not a string')

            const masterPinBytes = converters.stringToByteArray(masterPin)
            const masterPinUint8 = Uint8Array.from(masterPinBytes)

            // Unwrap the wrapped masterPhrase object
            unwrapKeyWithPin(masterPinUint8, masterPhraseObj)
              .catch(err => {
                if (err.type === 'OperationError') throw Error('PIN is incorrect')
                throw err
              })
              .then(masterPhraseBuffer => {
                const masterPhraseUint8 = new Uint8Array(masterPhraseBuffer)
                return converters.byteArrayToHexString(Array.from(masterPhraseUint8))
              })
              .then(masterPhraseHex => encodeTransactionBytes(txType, txData, masterPhraseHex))
              .then(({ transactionJSON, transactionBytes, fullHash: transactionFullHash }) => {
                resolve({
                  transactionJSON,
                  transactionBytes,
                  transactionFullHash,
                })
              })
              .catch(reject)
          } else {
            // Get masterkey from browser's indexedDB
            callOnStore('prefs', prefs => {
              const req2 = prefs.get('masterkey')
              req2.onerror = err => reject(err)
              req2.onsuccess = ({ target: { result: defaultCryptoKey } }) => {
                if (!defaultCryptoKey) {
                  reject(new Error('vault masterKey is missing in this browser'))
                  return
                }

                // Unwrap the wrapped masterPhrase object
                unwrapKey(defaultCryptoKey, masterPhraseObj)
                  .then(masterPhraseBuffer => {
                    const masterPhraseUint8 = new Uint8Array(masterPhraseBuffer)
                    return converters.byteArrayToHexString(Array.from(masterPhraseUint8))
                  })
                  .then(masterPhraseHex => encodeTransactionBytes(txType, txData, masterPhraseHex))
                  .then(({ transactionJSON, transactionBytes, fullHash: transactionFullHash }) => {
                    resolve({
                      transactionJSON,
                      transactionBytes,
                      transactionFullHash,
                    })
                  })
                  .catch(reject)
              }
            })
          }
        }
      })
    })
  },
  signMessage: (entryId, messageHex, masterPin) => {
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
          if (!entry.masterPhrase) {
            reject(new Error('key masterPhrase is not stored in this browser'))
            return
          }

          // const { format, key, keyAlgo, unwrapAlgo, deriveAlgo } = entry.masterPhrase
          const { masterPhrase: masterPhraseObj } = entry

          // TODO: Update the lastUsedAt timestamp

          if (masterPhraseObj.deriveAlgo) {
            if (typeof masterPin !== 'string') throw new Error('masterPin is not a string')

            const masterPinBytes = converters.stringToByteArray(masterPin)
            const masterPinUint8 = Uint8Array.from(masterPinBytes)

            // Unwrap the wrapped masterPhrase object
            unwrapKeyWithPin(masterPinUint8, masterPhraseObj)
              .then(masterPhraseBuffer => {
                const masterPhraseUint8 = new Uint8Array(masterPhraseBuffer)
                return converters.byteArrayToHexString(Array.from(masterPhraseUint8))
              })
              .then(masterPhraseHex => {
                const signature = NRS.signBytes(messageHex, masterPhraseHex)
                resolve({ signature })
              })
              .catch(reject)
          } else {
            // Get masterkey from browser's indexedDB
            callOnStore('prefs', prefs => {
              const req2 = prefs.get('masterkey')
              req2.onerror = err => reject(err)
              req2.onsuccess = ({ target: { result: defaultCryptoKey } }) => {
                if (!defaultCryptoKey) {
                  reject(new Error('vault masterKey is missing in this browser'))
                  return
                }

                unwrapKey(defaultCryptoKey, masterPhraseObj)
                  .then(masterPhraseBuffer => {
                    const masterPhraseUint8 = new Uint8Array(masterPhraseBuffer)
                    return converters.byteArrayToHexString(Array.from(masterPhraseUint8))
                  })
                  .then(masterPhraseHex => {
                    const signature = NRS.signBytes(messageHex, masterPhraseHex)
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
      data: {
        payload: [name, ...params],
        resultPort,
      },
    } = event

    if (!(name in methods)) {
      resultPort.postMessage(normalizeMsg({ error: new Error('invalid method name') }))
    }

    // Capture both sync and async errors when calling method
    return new Promise(resolve => resolve(methods[name](...params)))
      .then(
        res => resultPort.postMessage(res),
        err => resultPort.postMessage(normalizeMsg({ error: err }))
      )
      .then(() => resultPort.close())
  }

  log('Ready')
} else {
  log('self is undefined')
}
