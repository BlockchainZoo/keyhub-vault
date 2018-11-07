'use strict'

const fs = require('fs')

// eslint-disable-next-line import/no-extraneous-dependencies
const openpgp = require('openpgp') // use as CommonJS, AMD, ES6 module or via window.openpgp

const hkp = new openpgp.HKP('https://pgp.mit.edu')

openpgp.initWorker({ path: 'openpgp.worker.js' }) // set the relative web worker path

const FILEPATH_TO_KEYPAIR = '../../keyhub-vault-codesign-pgp'
const FILEPATH_TO_SIGN = process.argv[2] || './dist/js/main.bundle.js'

const options = {
  userIds: [{ name: 'KeyHub Vault Codesign', email: 'codesign@vault.keyhub.app' }], // support multiple user IDs
  curve: 'ed25519',
  passphrase: process.env.CODESIGN_PASSPHRASE,
}

if (!options.passphrase) {
  console.warn('Skip code-signing as env.CODESIGN_PASSPHRASE not provided') // eslint-disable-line no-console
} else {
  Promise.resolve()
    .then(() => ({
      publicKeyArmored: fs.readFileSync(`${FILEPATH_TO_KEYPAIR}.pub.asc`, 'utf8'),
      privateKeyArmored: fs.readFileSync(`${FILEPATH_TO_KEYPAIR}.key.asc`, 'utf8'),
    }))
    .catch(() => {
      // Generate new keyPair
      console.info('Generating key...') // eslint-disable-line no-console
      return openpgp.generateKey(options).then(key => {
        console.info('Keypair generated!') // eslint-disable-line no-console
        return hkp.upload(key.publicKeyArmored).then(() => {
          console.info('PublicKey uploaded!') // eslint-disable-line no-console
          fs.writeFileSync(`${FILEPATH_TO_KEYPAIR}.key.asc`, key.privateKeyArmored)
          fs.writeFileSync(`${FILEPATH_TO_KEYPAIR}.pub.asc`, key.publicKeyArmored)
          if (key.revocationCertificate)
            fs.writeFileSync(`${FILEPATH_TO_KEYPAIR}.revoke.asc`, key.revocationCertificate)
          return key
        })
      })
    })
    .then(({ publicKeyArmored, privateKeyArmored }) => {
      console.info('Decrypting key...') // eslint-disable-line no-console
      const publicKeys = openpgp.key.readArmored(publicKeyArmored).keys
      const privateKeys = openpgp.key.readArmored(privateKeyArmored).keys
      return Promise.all(
        privateKeys.map(privKeyObj => privKeyObj.decrypt(options.passphrase))
      ).then(() => ({
        publicKeys,
        privateKeys,
      }))
    })
    .then(({ publicKeys, privateKeys }) => {
      console.info('Signing code...') // eslint-disable-line no-console

      // const data = fs.readFileSync(FILEPATH_TO_SIGN, 'utf8')
      // const message = openpgp.message.fromText(data)
      // return message.signDetached(privateKeys, undefined, new Date(), {}).then(sig => ({
      //   signature: sig.armor(),
      // }))

      const data = fs.readFileSync(FILEPATH_TO_SIGN)

      return openpgp
        .sign({
          data,
          privateKeys,
          detached: true,
        })
        .catch(err => {
          console.error('cannot sign:', err) // eslint-disable-line no-console
        })
        .then(({ signature }) => ({ data, signature, publicKeys }))
    })
    .then(({ data, signature, publicKeys }) => {
      console.info('Generated code-signature...') // eslint-disable-line no-console
      fs.writeFileSync(`${FILEPATH_TO_SIGN}.sig.asc`, signature)

      const message = openpgp.message.fromBinary(data)
      return message
        .verifyDetached(openpgp.signature.readArmored(signature), publicKeys, new Date())
        .then(signatures => ({ data, signatures }))
      // return openpgp
      //   .verify({
      //     publicKeys,
      //     message: openpgp.message.fromBinary(data),
      //     signature: openpgp.signature.readArmored(signature),
      //   })
      //   .catch(err => {
      //     console.error('Cannot verify:', err) // eslint-disable-line no-console
      //   })
    })
    .then(({ data, signatures }) => {
      const { valid: isValid, signature } = signatures[0]
      const { created: signatureDate } = signature.packets[0]
      const text = data.toString('utf8')
      // eslint-disable-next-line no-console
      console.info(
        'File:',
        FILEPATH_TO_SIGN,
        '| Signature:',
        isValid ? 'valid' : 'invalid',
        '| Date:',
        signatureDate,
        '| lastLine:',
        text.slice(text.lastIndexOf('\n') + 1)
      )
    })
}
