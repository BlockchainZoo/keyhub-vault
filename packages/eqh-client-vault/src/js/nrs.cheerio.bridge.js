/* eslint-disable global-require, no-console */

// const { JSDOM } = require('jsdom')
// const jquery = require('jquery')
const cheerio = require('cheerio')
const qs = require('qs')
const { STATUS_CODES } = require('http')

// const fetch = require('node-fetch')
// require('abortcontroller-polyfill/dist/polyfill-patch-fetch')

// See: https://api.jquery.com/jQuery.ajax/
const jqAjax = (settings) => {
  const {
    url,
    crossDomain,
    dataType,
    type,
    method = type,
    timeout,
    // async,
    traditional,
    data,
    contentType,
    processData,
    xhrFields: { withCredentials } = {},
  } = settings

  let dataString
  if (!processData) dataString = qs.stringify(data, { arrayFormat: traditional ? 'repeat' : 'brackets' })

  // eslint-disable-next-line no-undef
  const controller = new AbortController()
  if (timeout) setTimeout(() => controller.abort(), timeout)

  let doneCallback
  let failCallback

  // eslint-disable-next-line no-undef
  const thenable = fetch(method === 'GET' && dataString ? `${url}?${dataString}` : url, {
    method,
    headers: {
      'Content-Type': contentType || 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: dataString,
    signal: controller.signal,
    mode: crossDomain ? 'cors' : undefined,
    credentials: withCredentials ? 'include' : undefined,
  }).catch((err) => {
    failCallback({}, null, err)
  }).then((res) => {
    const textStatus = STATUS_CODES[res.status]

    if (res.status >= 400) {
      const err = new Error(textStatus)
      if (failCallback) failCallback(res, textStatus, err)
      throw err
    }

    let ret
    if (dataType === 'json') ret = res.json()
    else if (dataType === 'html') ret = res.text()
    else if (dataType === 'text') ret = res.text()
    else if (dataType) throw new Error('Unsupported dataType')
    else ret = res.headers.get('content-type').includes('/json') ? res.json() : res.text()

    return ret.catch((err) => {
      if (failCallback) failCallback(res, textStatus, err)
      throw err
    }).then((resData) => {
      if (doneCallback) {
        doneCallback(
          resData,
          textStatus,
          (dataType === 'json' ? { responseJSON: resData } : { responseText: resData }),
        )
      }
    })
  })

  return Object.assign(thenable, {
    done(callback) { doneCallback = callback; return this },
    fail(callback) { failCallback = callback; return this },
  })
}

// See: https://api.jquery.com/jQuery.each/
const jqEach = (objOrArr, callback) => {
  if (Array.isArray(objOrArr)) {
    objOrArr.forEach((value, index) => callback(index, value))
  } else {
    Object.keys(objOrArr).forEach(propName => callback(propName, objOrArr[propName]))
  }
}

const jqMocks = {
  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  isEmptyObject: (obj) => { for (const k in obj) { return false } return true },
  inArray: (needle, arr) => arr.indexOf(needle),
  trim: text => text.trim(),
  extend: (obj, data) => Object.assign(obj, data),
  get fn() { return Object.getPrototypeOf(this) },
  growl: (msg) => { console.log(`growl: ${msg}`) },
  t: (text, params) => (params ? `${text} - ${params}` : text),
  support: {},
  i18n: null,
  each: jqEach,
  ajax: jqAjax,
}

const noop = function () { return this }
const jqPrototypeMocks = {
  show: noop,
  hide: noop,
  width: noop,
  height: noop,
  on: noop,
  one: noop,
  modal: noop,
  popover: noop,
  tooltip: noop,
  mask: noop,
  scrollTop: noop,
  click: noop,
  trigger: noop,
}

const options = {
  url: 'http://localhost:6876', // URL of NXT remote node
  secretPhrase: '', // Secret phrase of the current account
  isTestNet: false, // Select testnet or mainnet
  adminPassword: '', // Node admin password
}

const setCurrentAccount = (secretPhrase, client = global.client) => {
  // eslint-disable-next-line no-param-reassign
  client.account = client.getAccountId(secretPhrase)
  // eslint-disable-next-line no-param-reassign
  client.accountRS = client.convertNumericToRSAccountFormat(client.account)
  // eslint-disable-next-line no-param-reassign
  client.accountInfo = {} // Do not cache the public key
  client.resetEncryptionState()
}

const init = (params) => {
  if (!params) {
    return this
  }
  options.url = params.url
  options.secretPhrase = params.secretPhrase
  options.isTestNet = params.isTestNet
  options.adminPassword = params.adminPassword
  return this
}

const load = (callback) => {
  try {
    // jsdom is necessary to define the window object on which jquery relies
    // const { window } = new JSDOM()

    console.log('Started')

    // Load the necessary node modules and assign them to the global scope
    // the NXT client wasn't designed with modularity in mind therefore we need
    // to include every 3rd party library function in the global scope
    const $ = cheerio.load('<div></div>')
    Object.assign($, jqMocks)
    Object.assign($.prototype, jqPrototypeMocks)
    global.jQuery = $
    // global.jQuery.growl = (msg) => { console.log(`growl: ${msg}`) } // disable growl messages
    // global.jQuery.t = text => text // Disable the translation functionality
    // global.$ = global.jQuery // Needed by extensions.js
    global.CryptoJS = require('crypto-js')
    global.async = require('async')
    global.pako = require('pako')
    const jsbn = require('jsbn')
    global.BigInteger = jsbn.BigInteger

    // Support for Webworkers
    if (typeof self !== 'undefined') { // eslint-disable-line no-restricted-globals
      global.window = self // eslint-disable-line no-restricted-globals, no-undef
      global.window.console = console
    } else if (typeof window !== 'undefined') {
      global.window = window // eslint-disable-line no-undef
      global.window.console = console
      if (!global.window.crypto && !global.window.msCrypto) {
        global.crypto = require('crypto')
      }
    } else {
      // const { JSDOM } = require('jsdom')
      // const { window } = new JSDOM()
      // global.window = window
      // global.window.console = console
    }

    // Mock other objects on which the client depends
    global.document = {}
    global.isNode = true // for code which has to execute differently by node compared to browser
    global.navigator = { userAgent: '' }

    // Now load some NXT specific libraries into the global scope
    global.NxtAddress = require('./util/nxtaddress')
    global.curve25519 = require('./crypto/curve25519')
    global.curve25519_ = require('./crypto/curve25519_') // eslint-disable-line no-underscore-dangle
    require('./util/extensions') // Add extensions to String.prototype and Number.prototype
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
    setCurrentAccount(options.secretPhrase, global.client)

    // Now load the constants locally since we cannot trust the remote node to
    // return the correct constants.
    global.client.processConstants(require('./data/constants'))
    callback(global.client)
  } catch (err) {
    console.log(err.message || err)
    console.log(err.stack)
    throw err
  }
}

export { init, load, setCurrentAccount }
