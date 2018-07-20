
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

const browserRandom = (count, options) => {
  const nativeArr = new Uint8Array(count)
  const crypto = window.crypto || window.msCrypto // eslint-disable-line no-undef
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

function secureRandom(count, options = { type: 'Array' }) {
  // we check for process.pid to prevent browserify from tricking us
  if (process.env.APP_ENV !== 'browser' && typeof process !== 'undefined' && typeof process.pid === 'number') {
    const crypto = require('crypto') // eslint-disable-line global-require
    return nodeRandom(count, options, crypto)
  }

  const crypto = window.crypto || window.msCrypto // eslint-disable-line no-undef
  if (!crypto) throw new Error('Your browser does not support window.crypto.')
  return browserRandom(count, options)
}

const getRandomInt = (min, max) => {
  // Create byte array and fill with 1 random number
  const byteArray = secureRandom(1, { type: 'Uint8Array' })
  const r = max - min + 1
  const maxRange = 256
  if (byteArray[0] >= Math.floor(maxRange / r) * r) return getRandomInt(min, max)
  return min + (byteArray[0] % r)
}

const diceRoll = () => getRandomInt(1, 6)

const range = max => Array.from(Array(max).keys())

const diceSeq = count => range(count).map(() => diceRoll()).join('')

const getRandomWord = language => language[diceSeq(5)]

const getRandomPassword = (opts) => {
  const options = Object.assign({
    wordcount: 12,
    format: 'string',
  }, opts)
  if (typeof options.language !== 'object') {
    throw new Error('Language empty')
  }
  if (Object.keys(options.language).length < 7776) {
    throw new Error('Language length wrong')
  }
  const words = range(options.wordcount).map(() => getRandomWord(options.language))
  return (options.format === 'array') ? words : words.join(' ')
}

module.exports = getRandomPassword
