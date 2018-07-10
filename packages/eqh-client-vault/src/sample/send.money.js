const loader = require('./loader')
const converters = require('../js/util/converters')

const { config } = loader

loader.load((NRS) => {
  // Compose the request data
  const data = {
    recipient: NRS.getAccountIdFromPublicKey(config.recipientPublicKey), // public key to account id
    // Optional - public key announcement to init a new account
    recipientPublicKey: config.recipientPublicKey,
    amountNQT: NRS.convertToNQT('1.234'), // NXT to NQT conversion
    secretPhrase: config.secretPhrase,
    encryptedMessageIsPrunable: 'true', // Optional - make the attached message prunable
    ...NRS.getMandatoryParams(),
    ...NRS.encryptMessage(NRS, 'note to myself', config.secretPhrase, NRS.getPublicKey(converters.stringToHexString(config.secretPhrase)), true),
    ...NRS.encryptMessage(NRS, 'message to recipient', config.secretPhrase, config.recipientPublicKey, false),
  }

  // Submit the request to the remote node using the standard client function
  // which performs local signing for transactions
  // and validates the data returned from the server.
  // This method will only send the passphrase to the server in requests
  // for which the passphrase is required like startForging
  // It will never submit the passphrase for transaction requests
  NRS.sendRequest('sendMoney', data, (response) => {
    NRS.logConsole(JSON.stringify(response))
  })
})
