const loader = require('./loader')
const converters = require('../js/util/converters')

const { config } = loader

loader.load((NRS) => {
  const data = {
    recipient: NRS.getAccountIdFromPublicKey(config.recipientPublicKey),
    secretPhrase: config.secretPhrase,
    encryptedMessageIsPrunable: 'true',
    ...NRS.getMandatoryParams(),
    ...NRS.encryptMessage(NRS, 'message to recipient', config.secretPhrase, config.recipientPublicKey, false),
  }

  NRS.sendRequest('sendMessage', data, (response) => {
    NRS.logConsole(`sendMessage1 response: ${JSON.stringify(response)}`)
    // Now send a response message
    const senderSecretPhrase = 'rshw9abtpsa2'

    // change the account which submits the transactions
    loader.setCurrentAccount(senderSecretPhrase)

    const data2 = {
      recipient: NRS.getAccountId(config.secretPhrase),
      secretPhrase: senderSecretPhrase,
      encryptedMessageIsPrunable: 'true',
      ...NRS.getMandatoryParams(),
      ...NRS.encryptMessage(NRS, 'response message', senderSecretPhrase, NRS.getPublicKey(converters.stringToHexString(config.secretPhrase), false), false),
    }

    NRS.sendRequest('sendMessage', data2, (response2) => {
      NRS.logConsole(`sendMessage2 response: ${JSON.stringify(response2)}`)
    })
  })
})
