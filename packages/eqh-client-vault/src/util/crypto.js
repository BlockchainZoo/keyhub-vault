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
      for (let i = 0; i < count; i += 1) { arr[i] = buf.readUInt8(i) }
      return arr
    default:
      throw new Error(`${options.type} is unsupported.`)
  }
}

const browserRandom = (count, options, window = window || self) => { // eslint-disable-line
  const nativeArr = new Uint8Array(count)
  const crypto = window.crypto || window.msCrypto
  crypto.getRandomValues(nativeArr)

  switch (options.type) {
    case 'Array':
      return [].slice.call(nativeArr)
    case 'Buffer':
      try { Buffer.alloc(1) } catch (e) { throw new Error('Buffer not supported in this environment. Use Node.js or Browserify for browser support.') }
      return Buffer.from(nativeArr)
    case 'Uint8Array':
      return nativeArr
    default:
      throw new Error(`${options.type} is unsupported.`)
  }
}

const secureRandom = (count, options = { type: 'Array' }, window = window || self) => { // eslint-disable-line
  // we check for process.pid to prevent browserify from tricking us
  if (process.env.APP_ENV !== 'browser' && typeof process !== 'undefined' && typeof process.pid === 'number') {
    const crypto = require('crypto') // eslint-disable-line global-require
    return nodeRandom(count, options, crypto)
  }

  const crypto = window.crypto || window.msCrypto
  if (!crypto) throw new Error('Your browser does not support window.crypto.')
  return browserRandom(count, options)
}

const getCrypto = (window = window || self) => { // eslint-disable-line
  // we check for process.pid to prevent browserify from tricking us
  if (process.env.APP_ENV !== 'browser' && typeof process !== 'undefined' && typeof process.pid === 'number') {
    return require('crypto') // eslint-disable-line global-require
  }

  const crypto = window.crypto || window.msCrypto
  if (!crypto) throw new Error('Your browser does not support window.crypto.')
  return crypto
}

const getCryptoSubtle = (window = window || self) => { // eslint-disable-line
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

module.exports = {
  secureRandom,
  getRandomInt,
  getCryptoSubtle,
}