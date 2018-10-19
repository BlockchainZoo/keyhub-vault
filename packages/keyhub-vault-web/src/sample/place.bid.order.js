
const loader = require('./loader')

const { config } = loader

loader.load((NRS) => {
  const decimals = 2
  const quantity = 123.45
  const price = 1.2

  const data = {
    asset: '6094526212840718212',
    quantityQNT: NRS.convertToQNT(quantity, decimals),
    priceNQT: NRS.calculatePricePerWholeQNT(NRS.convertToNQT(price), decimals),
    secretPhrase: config.secretPhrase,
    ...NRS.getMandatoryParams(),
  }

  NRS.sendRequest('placeBidOrder', data, (response) => {
    NRS.logConsole(JSON.stringify(response))
  })
})
