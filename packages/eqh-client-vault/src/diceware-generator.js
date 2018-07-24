const { getRandomInt } = require('./util/crypto')

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
