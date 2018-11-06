'use strict'

const loader = require('./loader')

const { config } = loader

loader.load(NRS => {
  const decimals = 2
  const quantity = 2.5
  const price = 1.3

  const data = {
    asset: '6094526212840718212', // testnet Megasset
    quantityQNT: NRS.convertToQNT(quantity, decimals),
    priceNQT: NRS.calculatePricePerWholeQNT(NRS.convertToNQT(price), decimals),
    secretPhrase: config.secretPhrase,
    ...NRS.getMandatoryParams(),
  }

  NRS.sendRequest('placeAskOrder', data, response => {
    NRS.logConsole(JSON.stringify(response))
  })
})
