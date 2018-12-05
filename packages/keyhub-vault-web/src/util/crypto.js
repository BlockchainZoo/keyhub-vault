'use strict'

const nodeRandom = (count, options, crypto) => {
  const buf = crypto.randomBytes(count)

  let arr
  switch (options.type) {
    case 'Array':
      return [].slice.call(buf)
    case 'Buffer':
      return buf
    case 'Uint8Array':
      arr = new Uint8Array(count)
      for (let i = 0; i < count; i += 1) {
        arr[i] = buf.readUInt8(i)
      }
      return arr
    default:
      throw new Error(`${options.type} is unsupported.`)
  }
}

// eslint-disable-next-line
const browserRandom = (count, options, window = window || self) => {
  // eslint-disable-line
  const nativeArr = new Uint8Array(count)
  const crypto = window.crypto || window.msCrypto
  crypto.getRandomValues(nativeArr)

  switch (options.type) {
    case 'Array':
      return [].slice.call(nativeArr)
    case 'Buffer':
      try {
        Buffer.alloc(1)
      } catch (e) {
        throw new Error(
          'Buffer not supported in this environment. Use Node.js or Browserify for browser support.'
        )
      }
      return Buffer.from(nativeArr)
    case 'Uint8Array':
      return nativeArr
    default:
      throw new Error(`${options.type} is unsupported.`)
  }
}

// eslint-disable-next-line
const secureRandom = (count, options = { type: 'Array' }, window = window || self) => {
  // eslint-disable-line
  // we check for process.pid to prevent browserify from tricking us
  if (
    process.env.APP_ENV !== 'browser' &&
    typeof process !== 'undefined' &&
    typeof process.pid === 'number'
  ) {
    const crypto = require('crypto') // eslint-disable-line global-require
    return nodeRandom(count, options, crypto)
  }

  const crypto = window.crypto || window.msCrypto
  if (!crypto) throw new Error('Your browser does not support window.crypto.')
  return browserRandom(count, options)
}

// eslint-disable-next-line
const getCrypto = (window = window || self) => {
  // eslint-disable-line
  // we check for process.pid to prevent browserify from tricking us
  if (
    process.env.APP_ENV !== 'browser' &&
    typeof process !== 'undefined' &&
    typeof process.pid === 'number'
  ) {
    return require('crypto') // eslint-disable-line global-require
  }

  const crypto = window.crypto || window.msCrypto
  if (!crypto) throw new Error('Your browser does not support window.crypto.')
  return crypto
}

// eslint-disable-next-line
const getCryptoSubtle = (window = window || self) => {
  const crypto = getCrypto(window)
  return crypto.webkitSubtle || crypto.subtle
}

const getRandomInt = (min, max) => {
  // Create byte array and fill with 1 random number
  const byteArray = secureRandom(1, { type: 'Uint8Array' })
  const r = max - min + 1
  const maxRange = 256
  if (byteArray[0] >= Math.floor(maxRange / r) * r) return getRandomInt(min, max)
  return min + (byteArray[0] % r)
}

const safeObj = obj => Object.assign(Object.create(null), obj)

const exportKey = (cryptoKey, subtle = getCryptoSubtle()) =>
  // Retrieve the keyMaterial as a ArrayBuffer
  subtle.exportKey('raw', cryptoKey)

const exportKeys = arr => {
  const subtle = getCryptoSubtle()
  return Promise.all(
    arr.map(key => {
      if (key instanceof CryptoKey) {
        return exportKey(key, subtle)
      }
      return key
    })
  )
}

const digest = (messageArrayBuf, algo = { name: 'SHA-384' }) => {
  const subtle = getCryptoSubtle()
  return subtle.digest(safeObj(algo), messageArrayBuf)
}

const digestKeyed = (keyArrayBuf, messageArrayBuf, algo = { name: 'SHA-512' }) => {
  // See: https://security.stackexchange.com/questions/79577/whats-the-difference-between-hmac-sha256key-data-and-sha256key-data
  const subtle = getCryptoSubtle()
  return subtle
    .importKey(
      'raw',
      keyArrayBuf,
      { name: 'HMAC', length: keyArrayBuf.byteLength * 8, hash: safeObj(algo) },
      false,
      ['sign', 'verify']
    )
    .then(cryptoKey => subtle.sign({ name: 'HMAC' }, cryptoKey, messageArrayBuf))
}

const encrypt = (plaintextArrayBuf, strongCryptoKey, algo) => {
  const subtle = getCryptoSubtle()
  return subtle.encrypt(safeObj(algo), strongCryptoKey, plaintextArrayBuf)
}

const decrypt = (ciphertextArrayBuf, strongCryptoKey, algo) => {
  const subtle = getCryptoSubtle()
  return subtle.decrypt(safeObj(algo), strongCryptoKey, ciphertextArrayBuf)
}

const wrapKey = (plainkeyArrayBuf, strongCryptoKey, { format, keyAlgo, wrapAlgo, deriveAlgo }) => {
  const subtle = getCryptoSubtle()

  // Convert the secretKey into a native CryptoKey
  return subtle
    .importKey('raw', plainkeyArrayBuf, safeObj(keyAlgo), true, ['encrypt', 'decrypt'])
    .then(cryptoKey =>
      // Use the Strengthened/Strong CryptoKey to wrap / encrypt the main CryptoKey
      subtle
        .wrapKey(format, cryptoKey, strongCryptoKey, safeObj(wrapAlgo))
        .then(ciphertextBuffer => [
          {
            format,
            key: ciphertextBuffer,
            keyAlgo,
            wrapAlgo,
            deriveAlgo,
          },
          cryptoKey,
        ])
    )
}

const wrapKeyWithPin = (plainkeyArrayBuf, secretPinArrayBuf, opts) => {
  const subtle = getCryptoSubtle()

  const { keyAlgo, deriveAlgo } = opts

  // Convert the Pin into a native CryptoKey
  return subtle
    .importKey('raw', secretPinArrayBuf, deriveAlgo.name, false, ['deriveKey'])
    .then(weakKey =>
      // Strengthen the Pin CryptoKey by using PBKDF2
      subtle.deriveKey(safeObj(deriveAlgo), weakKey, safeObj(keyAlgo), false, [
        'encrypt',
        'wrapKey',
      ])
    )
    .then(strongKey =>
      // Use the Strengthened CryptoKey to wrap the main CryptoKey
      wrapKey(plainkeyArrayBuf, strongKey, opts)
    )
}

const unwrapKey = (strongCryptoKey, { format, key, keyAlgo, wrapAlgo: unwrapAlgo }) => {
  const subtle = getCryptoSubtle()

  // Use the Strengthened CryptoKey to unwrap the main CryptoKey
  return subtle
    .unwrapKey(format, key, strongCryptoKey, safeObj(unwrapAlgo), safeObj(keyAlgo), true, [
      'encrypt',
      'decrypt',
    ])
    .then(cryptoKey =>
      // Retrieve the secretKey as an Uint8 ArrayBuffer
      subtle.exportKey('raw', cryptoKey)
    )
}

const unwrapKeyWithPin = (secretPinArrayBuf, wrappedKeyWithOpts) => {
  const subtle = getCryptoSubtle()

  const { keyAlgo, deriveAlgo } = wrappedKeyWithOpts

  // Convert the Pin into a native CryptoKey
  return subtle
    .importKey('raw', secretPinArrayBuf, deriveAlgo.name, false, ['deriveKey'])
    .then(weakKey =>
      // Strengthen the Pin CryptoKey by using PBKDF2
      subtle.deriveKey(safeObj(deriveAlgo), weakKey, safeObj(keyAlgo), false, [
        'decrypt',
        'unwrapKey',
      ])
    )
    .then(strongKey =>
      // Use the Strengthened CryptoKey to unwrap the secretPhrase CryptoKey
      unwrapKey(strongKey, wrappedKeyWithOpts)
    )
}

const genInitVector = () => secureRandom(12, { type: 'Uint8Array' }).buffer

const genDeriveAlgo = () =>
  safeObj({
    name: 'PBKDF2',
    hash: 'SHA-384', // Note: Non-truncated SHA is vulnerable to length extension attack (e.g. sha256 & sha512)
    salt: secureRandom(16, { type: 'Uint8Array' }).buffer,
    iterations: 1e6,
  })

module.exports = {
  get crypto() {
    return getCrypto()
  },
  get subtle() {
    return getCryptoSubtle()
  },
  secureRandom,
  getRandomInt,
  safeObj,
  exportKey,
  exportKeys,
  digest,
  digestKeyed,
  encrypt,
  decrypt,
  wrapKey,
  wrapKeyWithPin,
  unwrapKey,
  unwrapKeyWithPin,
  genInitVector,
  genDeriveAlgo,
}
