/* eslint-disable global-require, no-console */

const jsdom = require('jsdom')
const jquery = require('jquery')

const options = {
  url: 'http://localhost:6876', // URL of NXT remote node
  secretPhrase: '', // Secret phrase of the current account
  isTestNet: false, // Select testnet or mainnet
  adminPassword: '', // Node admin password
}

function setCurrentAccount(secretPhrase, client = global.client) {
  // eslint-disable-next-line no-param-reassign
  client.account = client.getAccountId(secretPhrase)
  // eslint-disable-next-line no-param-reassign
  client.accountRS = client.convertNumericToRSAccountFormat(client.account)
  // eslint-disable-next-line no-param-reassign
  client.accountInfo = {} // Do not cache the public key
  client.resetEncryptionState()
}

exports.init = (params) => {
  if (!params) {
    return this
  }
  options.url = params.url
  options.secretPhrase = params.secretPhrase
  options.isTestNet = params.isTestNet
  options.adminPassword = params.adminPassword
  return this
}

exports.load = (callback) => {
  // jsdom is necessary to define the window object on which jquery relies
  jsdom.env('', (err, window) => {
    try {
      if (err) {
        console.error(err)
        return
      }
      console.log('Started')

      // Load the necessary node modules and assign them to the global scope
      // the NXT client wasn't designed with modularity in mind therefore we need
      // to include every 3rd party library function in the global scope
      global.jQuery = jquery(window)
      global.jQuery.growl = (msg) => { console.log(`growl: ${msg}`) } // disable growl messages
      global.jQuery.t = text => text // Disable the translation functionality
      global.$ = global.jQuery // Needed by extensions.js
      global.crypto = require('crypto')
      global.CryptoJS = require('crypto-js')
      global.async = require('async')
      global.pako = require('pako')
      const jsbn = require('jsbn')
      global.BigInteger = jsbn.BigInteger
      global.window = window
      global.window.console = console

      // Mock other objects on which the client depends
      global.document = {}
      global.isNode = true // for code which has to execute differently by node compared to browser
      global.navigator = { userAgent: '' }

      // Now load some NXT specific libraries into the global scope
      global.NxtAddress = require('./util/nxtaddress')
      global.curve25519 = require('./crypto/curve25519')
      global.curve25519_ = require('./crypto/curve25519_') // eslint-disable-line no-underscore-dangle
      require('./util/extensions')
      global.converters = require('./util/converters')

      // Now start loading the client itself
      // The main challenge is that in node every JavaScript file is a module with it's own scope
      // however the NXT client relies on a global browser scope which defines the NRS object
      // The idea here is to gradually compose the NRS object by adding functions from each
      // JavaScript file into the existing global.client scope
      global.client = {}
      global.client.isTestNet = options.isTestNet
      Object.assign(global.client, require('./nrs.encryption'))
      Object.assign(global.client, require('./nrs.feature.detection'))
      Object.assign(global.client, require('./nrs.transactions.types'))
      Object.assign(global.client, require('./nrs.constants'))
      Object.assign(global.client, require('./nrs.console'))
      Object.assign(global.client, require('./nrs.util'))
      global.client.getModuleConfig = () => options
      Object.assign(global.client, require('./nrs'))
      Object.assign(global.client, require('./nrs.server'))
      setCurrentAccount(options.secretPhrase)

      // Now load the constants locally since we cannot trust the remote node to
      // return the correct constants.
      const constants = require('./data/constants')
      global.client.processConstants(constants)
      callback(global.client)
    } catch (e) {
      console.log(e.message)
      console.log(e.stack)
      throw e
    }
  })
}

exports.setCurrentAccount = setCurrentAccount
