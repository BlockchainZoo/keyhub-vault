'use strict'

global.isNode = true

const { NrsBridge } = require('./js/nrs.cheerio.bridge')
const converters = require('./js/util/converters')

module.exports = {
  NrsBridge,
  converters,
}
