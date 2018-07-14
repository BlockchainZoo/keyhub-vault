const loader = require('./loader')

const { config } = loader

loader.load((NRS) => {
  const property = '$$Admin'

  const data = {
    recipient: NRS.getAccountIdFromPublicKey(config.recipientPublicKey),
    property,
    value: '1',
    secretPhrase: config.secretPhrase,
    ...NRS.getMandatoryParams(),
  }

  NRS.sendRequest('setAccountProperty', data, (response) => {
    NRS.logConsole(JSON.stringify(response))
  })
})
