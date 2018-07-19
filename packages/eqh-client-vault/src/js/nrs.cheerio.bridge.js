/* eslint-disable global-require, no-console */

// const { JSDOM } = require('jsdom')
// const jquery = require('jquery')
const cheerio = require('cheerio')
const qs = require('qs')

if (process.env.APP_ENV !== 'browser') {
  global.fetch = require('node-fetch')
  require('abortcontroller-polyfill/dist/polyfill-patch-fetch')
}

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
    data: dataObj,
    contentType,
    processData = true,
    xhrFields: { withCredentials } = {},
  } = settings

  let doneCallback
  let failCallback

  const data = (typeof dataObj !== 'string' && processData)
    ? qs.stringify(dataObj, { arrayFormat: traditional ? 'repeat' : 'brackets' })
    : dataObj

  // eslint-disable-next-line no-undef
  const controller = (typeof global.AbortController !== 'undefined') ? new AbortController() : null
  const abortTimer = (controller && timeout) ? setTimeout(() => controller.abort(), timeout) : null

  // eslint-disable-next-line no-undef
  const thenable = fetch(method === 'GET' && processData ? `${url}?${dataString}` : url, {
    method,
    headers: {
      'Content-Type': contentType || 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: data,
    signal: controller && controller.signal,
    mode: crossDomain ? 'cors' : undefined,
    credentials: withCredentials ? 'include' : undefined,
  }).catch((err) => {
    if (abortTimer) clearTimeout(abortTimer)
    if (failCallback) failCallback({}, null, err)
  }).then((res) => {
    const textStatus = res.statusText

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
      if (abortTimer) clearTimeout(abortTimer)
      if (failCallback) failCallback(res, textStatus, err)
      throw err
    }).then((resData) => {
      if (abortTimer) clearTimeout(abortTimer)
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
  t: (text, params) => (params ? `${text} - ${JSON.stringify(params)}` : text),
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

const defaultOptions = {
  url: 'http://localhost:6876', // URL of NXT remote node
  accountRS: '', // RS of the current account
  isTestNet: false, // Select testnet or mainnet
  adminPassword: '', // Node admin password
  lastKnownBlock: { id: '15547113949993887183', height: '712' }, // last known EcBlock
}

class NrsBridge {
  constructor(params) {
    this.options = { ...defaultOptions }
    if (params) Object.assign(this.options, params, { init: true })
    return this
  }

  static setCurrentAccount(accountRS, client) {
    // eslint-disable-next-line no-param-reassign
    client.account = client.convertRSToNumericAccountFormat(accountRS)
    // eslint-disable-next-line no-param-reassign
    client.accountRS = client.convertNumericToRSAccountFormat(client.account)
    // eslint-disable-next-line no-param-reassign
    client.accountInfo = {} // Do not cache the public key
    client.resetEncryptionState()
  }

  configure(params = this.options, client = this.client) {
    // eslint-disable-next-line no-param-reassign
    client.isTestNet = params.isTestNet || this.options.isTestNet
    this.constructor.setCurrentAccount(params.accountRS || this.options.accountRS, client)
    if (params.getter) {
      client.getModuleConfig = params.getter // eslint-disable-line no-param-reassign
    } else {
      const opts = { ...this.options, ...params }
      client.getModuleConfig = () => opts // eslint-disable-line no-param-reassign
    }
    const { constants } = client
    if (client.isTestNet) {
      // eslint-disable-next-line no-param-reassign
      constants.LAST_KNOWN_TESTNET_BLOCK = params.lastKnownBlock || this.options.lastKnownBlock
    } else {
      // eslint-disable-next-line no-param-reassign
      constants.LAST_KNOWN_BLOCK = params.lastKnownBlock || this.options.lastKnownBlock
    }
    return this
  }

  load(callback) {
    try {
      // jsdom is necessary to define the window object on which jquery relies
      // const { window } = new JSDOM()

      console.log('Initializing NRS-client...')

      // Load the necessary node modules and assign them to the global scope
      // the NXT client wasn't designed with modularity in mind therefore we need
      // to include every 3rd party library function in the global scope
      const jQuery = cheerio.load('<div></div>')
      Object.assign(jQuery, jqMocks)
      Object.assign(jQuery.prototype, jqPrototypeMocks)
      global.jQuery = jQuery

      // global.$ = global.jQuery // No longer needed by extensions.js
      global.CryptoJS = require('crypto-js')
      global.async = require('async')
      global.pako = require('pako')
      const jsbn = require('jsbn')
      global.BigInteger = jsbn.BigInteger

      // Support for Webworkers
      if (typeof global.window !== 'undefined') {
        // Browser Renderer Process
        if (!global.window.crypto && !global.window.msCrypto) {
          global.crypto = require('crypto')
        }
      } else if (typeof self !== 'undefined') { // eslint-disable-line no-restricted-globals
        // WebWorker
        global.window = self // eslint-disable-line no-restricted-globals, no-undef
        if (!global.window.crypto && !global.window.msCrypto) {
          global.crypto = require('crypto')
        }
      } else if (process.env.APP_ENV !== 'browser') {
        // Nodejs
        const { JSDOM } = require('jsdom')
        const { window } = new JSDOM()
        global.window = window
        global.window.console = console
      }

      // Mock other objects on which the client depends
      if (typeof global.window.document === 'undefined') global.window.document = {}
      if (typeof global.window.navigator === 'undefined') global.window.navigator = { userAgent: '' }
      global.isNode = true // for code which has to execute differently by node compared to browser

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
      const client = {}
      global.client = client
      Object.assign(client, require('./nrs.encryption'))
      Object.assign(client, require('./nrs.feature.detection'))
      Object.assign(client, require('./nrs.transactions.types'))
      Object.assign(client, require('./nrs.constants'))
      Object.assign(client, require('./nrs.console'))
      Object.assign(client, require('./nrs.util'))
      Object.assign(client, require('./nrs'))
      Object.assign(client, require('./nrs.server'))

      if (this.options.init) this.config(this.options, client)

      // Now load the constants locally since we cannot trust the remote node to
      // return the correct constants.
      client.processConstants(require('../conf/constants'))
      this.client = client
      callback(this.client)
    } catch (err) {
      console.log(err.message || err)
      console.log(err.stack)
      throw err
    }

    return this
  }
}

module.exports = {
  NrsBridge,
}
