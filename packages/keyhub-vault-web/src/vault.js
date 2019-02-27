import { safeHtml, stripIndent } from 'common-tags'

import postRobot from 'post-robot'

// import pRetry from 'p-retry'

import VaultWorker from './vault.worker'

import {
  WelcomeScreen,
  LoadingScreen,
  KeyAddScreen,
  KeyRestoreScreen,
  PassphraseDisplayScreen,
  PassphraseConfirmScreen,
  PhonenumConfirmScreen,
  TxDetailScreen,
  SuccessScreen,
  KeyDetailScreen,
} from './screen'

const { callOnStore } = require('./util/indexeddb')

const { postMessage } = require('./util/webworker')

const { drawText, getImageData } = require('./util/canvas')

// VaultWorker singletons from multiple networks
// One platform might run multiple networks (e.g. mainnet)
const workers = Object.create(null)

const activateNetwork = (networkName, address) => {
  // Lazy-Load Webworker
  if (!workers[networkName]) workers[networkName] = new VaultWorker()
  const worker = workers[networkName]

  // call configure on background webworker to get current config
  return postMessage(worker, ['configure', { networkName, address }]).then(config => ({
    worker,
    config,
  }))
}

const appendStylesheet = (href, document) =>
  new Promise((resolve, reject) => {
    const linkElement = document.createElement('link')
    linkElement.type = 'text/css'
    linkElement.rel = 'stylesheet'
    linkElement.href = href
    linkElement.onload = resolve
    linkElement.onerror = reject
    document.head.appendChild(linkElement)
  })

const registerEvents = (service, eventHandlers, desiredVersion) => {
  const [, majorStr, minorStr, patchStr] = desiredVersion.match(/(\d+)\.(\d+)\.(\d+)/)
  if (!majorStr || !minorStr || !patchStr) throw new Error('invalid version')

  const major = +majorStr
  let minor = +minorStr
  let patch = +patchStr
  let version

  // Enable all suitable event handlers for desiredVersion
  while (minor >= 0) {
    while (patch >= 0) {
      const ver = `${major}.${minor}.${patch}`
      if (eventHandlers[ver]) {
        if (!version) version = ver
        const handlers = eventHandlers[ver]
        Object.keys(handlers).forEach(eventName => {
          try {
            service.on(eventName, handlers[eventName])
          } catch (err) {
            // nothing
          }
        })
      }
      patch -= 1
    }
    minor -= 1
    patch = 99
  }

  return version
}

const getKeyDetail = (network, entryId) =>
  activateNetwork(network).then(({ worker }) =>
    // call getKeyPair on background webworker
    postMessage(worker, ['getStoredKeyInfo', entryId]).then(
      ({ address, accountNo, publicKey, hasPinProtection, hasPassphrase }) => {
        if (!hasPassphrase) {
          return {
            network,
            address,
            accountNo,
            publicKey,
            hasPinProtection,
          }
        }

        return postMessage(worker, ['getStoredKeyPassphrase', entryId]).then(passphraseImage => ({
          network,
          address,
          accountNo,
          publicKey,
          hasPinProtection,
          passphraseImage,
        }))
      }
    )
  )

export default function loadVault(window, document, mainElement) {
  const vaultLayoutHTML = safeHtml`<div class="container fade-in" id="mainWrapper">
    <div class="row" >
      <div class="sidebar col-md-4 bg-grey py-3 d-none" id="sidebar">
        <div class="block-title">Keys in this browser's wallet</div>
        <div id="key-list" class="key-list"></div>
        <button class="btn btn-secondary btn-sm ml-1" id="goto-add-key-btn">Add / Restore Key</button>
      </div>
      <div class="col-md-8 offset-md-2 bg-white main-content" id="mainContent">
        <div class="entry-page py-3" id="content"></div>
      </div>
    </div>
  </div>`

  mainElement.innerHTML = vaultLayoutHTML // eslint-disable-line no-param-reassign

  const contentDiv = document.getElementById('content')
  const sidebarDiv = document.getElementById('sidebar')
  const keyListDiv = document.getElementById('key-list')
  const mainWrapper = document.getElementById('mainWrapper')
  const mainContent = document.getElementById('mainContent')

  const showGenerateUnprotectedKeyScreen = (platform, network, phonenum) =>
    activateNetwork(network).then(({ worker }) => {
      const message = stripIndent`
        We will text the seed-passphrase to your phone for backup purpose.
        SMS might be intercepted by an unknown third-party.`

      const pubkey = stripIndent`
      -----BEGIN PGP PUBLIC KEY BLOCK-----
      Version: OpenPGP.js v3.1.0
      Comment: https://openpgpjs.org

      xjMEW87lXhYJKwYBBAHaRw8BAQdAlIyAn31pcSBfq8JL+OZhxSJqNpce5kMR
      RT/Em2MvjTLNLGVxaCBLZXlIdWIgU01TIDxlcWguc21zQHBsYXRmb3JtLmtl
      eWh1Yi5hcHA+wncEEBYKACkFAlvO5V4GCwkHCAMCCRCfbznlpPf4PAQVCAoC
      AxYCAQIZAQIbAwIeAQAALuEBAOUe2KkUZA8ORr2i8AWOvmD3YYaZNlL2SNKS
      hDemF6tsAQDNBuQ9kmtK/c617kkqRDJu9PUsVvKUdf9SFqH6v+p/BM44BFvO
      5V4SCisGAQQBl1UBBQEBB0Dz1rTzNxVIZkybI8Kuc5+X9JZebkY0iSjA2D3N
      cf7PSQMBCAfCYQQYFggAEwUCW87lXgkQn2855aT3+DwCGwwAAHZSAP920Slk
      V4q8Z3ZY+trryvESUBpSqoWMhKJlUlhP4pvp4wEAgmTTx5Dl5K4YRvEMeh5O
      DZazk+YohUxifYrpNHuVjgU=
      =Qpzm
      -----END PGP PUBLIC KEY BLOCK-----
    `

      const [div, promise] = PhonenumConfirmScreen(document, phonenum, message)
      contentDiv.innerHTML = ''
      contentDiv.appendChild(div)

      return promise.then(([choice, phoneNumber]) => {
        contentDiv.innerHTML = ''
        contentDiv.appendChild(LoadingScreen(document, `Generating ${platform} Key`))

        return postMessage(worker, ['generatePassphrase', 10])
          .then(passphrase => `${platform.toLowerCase()} ${passphrase}`)
          .then(passphrase => {
            if (choice === 'skip') return { passphrase }
            // TODO: Updated OpenPGP version has breaking changes to API
            const openpgp = (window && window.openpgp) || global.openpgp
            const options = {
              data: passphrase,
              publicKeys: openpgp.key.readArmored(pubkey).keys,
              compression: openpgp.enums.compression.zlib,
            }
            return openpgp
              .encrypt(options)
              .then(({ data: encPassphrase }) => ({ passphrase, encPassphrase }))
          })
          .then(({ passphrase, encPassphrase }) => {
            contentDiv.innerHTML = ''
            contentDiv.appendChild(LoadingScreen(document, 'Storing Key in Browser'))
            const ctx = document.createElement('canvas').getContext('2d')
            const passphraseImage = getImageData(drawText(ctx, passphrase, 400))

            return postMessage(worker, [
              'storeUnprotectedKey',
              network,
              passphrase,
              passphraseImage,
            ]).then(({ id, address, accountNo, publicKey }) =>
              !encPassphrase
                ? {
                    id,
                    address,
                    accountNo,
                    publicKey,
                  }
                : {
                    id,
                    address,
                    accountNo,
                    publicKey,
                    phoneNumber,
                    encPassphrase,
                  }
            )
          })
      })
    })

  const showGenerateKeyScreen = (platform, network) =>
    activateNetwork(network).then(({ worker }) => {
      contentDiv.innerHTML = ''
      contentDiv.appendChild(LoadingScreen(document, `Generating Passphrase for ${platform}`))

      // call generatePassphrase on background webworker
      const p = postMessage(worker, ['generatePassphrase', 10]).then(
        passphrase => `${platform.toLowerCase()} ${passphrase}`
      )

      return p
        .then(passphrase => {
          const [div, promise] = PassphraseDisplayScreen(document, network, passphrase)
          contentDiv.innerHTML = ''
          contentDiv.appendChild(div)
          return promise
        })
        .then(([choice, passphrase]) => {
          if (choice !== 'ok') throw new Error('cancelled by user')

          const [div, promise] = PassphraseConfirmScreen(document, passphrase, true)
          contentDiv.innerHTML = ''
          contentDiv.appendChild(div)

          return promise.then(([choice2, pin]) => {
            if (choice2 !== 'ok') throw new Error('cancelled by user')

            contentDiv.innerHTML = ''
            contentDiv.appendChild(
              LoadingScreen(document, 'Securely Storing your Key in this Browser')
            )

            // call createKeyPair on background webworker
            return postMessage(worker, ['storeProtectedKey', network, passphrase, pin]).then(
              ({ id, address, accountNo, publicKey }) => ({
                id,
                address,
                accountNo,
                publicKey,
                pin,
              })
            )
          })
        })
    })

  const showAddKeyScreen = () => {
    const [div, promise] = KeyAddScreen(document)
    contentDiv.innerHTML = ''
    contentDiv.appendChild(div)
    return promise.then(({ platform, network }) => showGenerateKeyScreen(platform, network))
  }

  const showRestoreMissingKeyScreen = (platform, network, desiredAddress) =>
    activateNetwork(network).then(({ worker }) => {
      const message = stripIndent`
        Key for ${desiredAddress} is missing from this browser.
        Please restore your ${network} key using a backup of your seed-passphrase.`

      const [div, promise] = KeyRestoreScreen(
        document,
        'Key Missing',
        message,
        platform,
        desiredAddress,
        passphrase => postMessage(worker, ['getPassphraseInfo', network, passphrase])
      )
      contentDiv.innerHTML = ''
      contentDiv.appendChild(div)

      return promise.then(([choice, passphrase]) => {
        if (choice !== 'ok') throw new Error('cancelled by user')
        contentDiv.innerHTML = ''
        contentDiv.appendChild(LoadingScreen(document, 'Storing Key in Browser'))
        const ctx = document.createElement('canvas').getContext('2d')
        const passphraseImage = getImageData(drawText(ctx, passphrase, 400))

        return postMessage(worker, [
          'storeUnprotectedKey',
          network,
          passphrase,
          passphraseImage,
        ]).then(({ id, address, accountNo, publicKey }) => ({
          id,
          address,
          accountNo,
          publicKey,
        }))
      })
    })

  const signTransaction = (network, address, tx, optionalPin = null) =>
    activateNetwork(network).then(({ worker }) => {
      contentDiv.innerHTML = ''
      contentDiv.appendChild(LoadingScreen(document, 'Signing Transaction'))

      return postMessage(worker, ['signTransaction', address, tx.type, tx.data, optionalPin]).then(
        ({ transactionBytes, transactionJSON, transactionFullHash }) => ({
          transactionBytes,
          transactionJSON,
          transactionFullHash,
        })
      )
    })

  const signMessage = (network, address, message, optionalPin = null) =>
    activateNetwork(network).then(({ worker }) => {
      contentDiv.innerHTML = ''
      contentDiv.appendChild(LoadingScreen(document, 'Signing Document'))

      // call signMessage on background worker
      return postMessage(worker, ['signMessage', address, message, optionalPin]).then(
        ({ signature }) => signature
      )
    })

  const updateKeyListDiv = () =>
    new Promise((resolve, reject) => {
      try {
        callOnStore('accounts', accounts => {
          const req = accounts.getAll()
          req.onsuccess = ({ target: { result: entries } }) => {
            if (Array.isArray(entries) && entries.length > 0) {
              // Group by network name
              const keysByNetwork = entries.reduce((acc, entry) => {
                const g = acc[entry.network || entry.platform]
                if (g) g.push(entry)
                else acc[entry.network || entry.platform] = [entry]
                return acc
              }, {})

              // onClick handler for <ul/>
              const onClick = ul => ({ target: { type, dataset, classList } }) => {
                if (type === 'button' && dataset) {
                  const { network, address, entryId } = dataset
                  activateNetwork(network, address)
                    .then(() => {
                      ul.querySelectorAll('button').forEach(
                        li => li.classList.remove('btn-dark') && li.classList.add('btn-light')
                      )
                      classList.remove('btn-light')
                      classList.add('btn-dark')
                      return getKeyDetail(network, entryId).then(keyDetail => {
                        const [div] = KeyDetailScreen(document, keyDetail)
                        contentDiv.innerHTML = ''
                        contentDiv.appendChild(div)
                      })
                    })
                    .catch(error => {
                      window.alert(error.message || error)
                    })
                }
              }

              keyListDiv.innerHTML = ''
              Object.keys(keysByNetwork).forEach(network => {
                const div = document.createElement('div')
                const h3 = document.createElement('h3')
                h3.appendChild(document.createTextNode(network))
                div.appendChild(h3)
                const ul = document.createElement('ul')
                ul.addEventListener('click', onClick(ul))

                const plaformKeys = keysByNetwork[network]
                plaformKeys.forEach(entry => {
                  const li = document.createElement('li')
                  const button = document.createElement('button') // eslint-disable-line
                  button.type = 'button'
                  button.classList.add('btn', 'btn-light')
                  button.appendChild(document.createTextNode(entry.address))
                  button.dataset.network = entry.network
                  button.dataset.address = entry.address
                  button.dataset.entryId = entry.id
                  li.appendChild(button)
                  ul.appendChild(li)
                })

                div.appendChild(ul)
                keyListDiv.appendChild(div)
              })

              resolve(true)
            } else {
              resolve(false)
            }
          }
        })
      } catch (err) {
        reject(err)
      }
    })

  // Map of event handlers by semantic versioning
  const eventHandlers = {}
  eventHandlers['1.3.0'] = {
    newUnprotectedKeyAndSign: ({ data: { params, callback } }) => {
      // Trigger A: App wants to create new unprotected key for user
      // Input: { params: { platform: 'EQH', network: 'Equinehub', messageHex: '', phoneNumber: '' } }
      // Output: { publicKey, signature }

      const { platform, network, messageHex, phoneNum = '' } = params
      if (!platform) throw new Error(`invalid platform ${platform}`)
      if (!network) throw new Error(`invalid network ${network}`)
      if (!messageHex) throw new Error(`invalid messageHex ${messageHex}`)

      return showGenerateUnprotectedKeyScreen(platform, network, phoneNum)
        .then(res => updateKeyListDiv().then(() => res))
        .then(({ address, publicKey, phoneNumber, encPassphrase }) =>
          signMessage(network, address, messageHex)
            .then(signature => {
              contentDiv.innerHTML = ''
              contentDiv.appendChild(LoadingScreen(document, 'Linking Account'))
              return signature
            })
            .then(
              signature =>
                callback(null, {
                  address,
                  publicKey,
                  signature,
                  phoneNumber,
                  encPassphrase,
                })
              // error => callback(error) // callback to the parent window with error
            )
            .then(() => {
              const message =
                'Account linked. Thank you for using our Open-source Vault. You will be returned to the parent app.'
              const [div, promise] = SuccessScreen(document, 'Thank You', message, 1200)
              contentDiv.innerHTML = ''
              contentDiv.appendChild(div)
              return promise
            })
            .then(() => ({
              network,
              address,
              publicKey,
            }))
        )
    },
    newKeyAndSign: ({ data: { params, callback } }) => {
      // Trigger B: App wants to create new key for user
      // Input: { params: { platform: 'EQH', network: 'Main', messageHex: '' } }
      // Output: { publicKey, signature }

      const { platform, network, messageHex } = params
      if (!platform) throw new Error(`invalid platform ${platform}`)
      if (!network) throw new Error(`invalid network ${network}`)
      if (!messageHex) throw new Error(`invalid messageHex ${messageHex}`)

      return showGenerateKeyScreen(platform, network)
        .then(res => updateKeyListDiv().then(() => res))
        .then(({ address, publicKey, pin }) =>
          signMessage(network, address, messageHex, pin)
            .then(signature => {
              contentDiv.innerHTML = ''
              contentDiv.appendChild(LoadingScreen(document, 'Linking Account'))
              return signature
            })
            .then(
              signature =>
                callback(null, {
                  address,
                  publicKey,
                  signature,
                })
              // error => callback(error) // callback to the parent window with error
            )
            .then(() => {
              const message =
                'Account linked. Thank you for using our Open-source Vault. You will be returned to the parent app.'
              const [div, promise] = SuccessScreen(document, 'Thank You', message, 1200)
              contentDiv.innerHTML = ''
              contentDiv.appendChild(div)
              return promise
            })
            .then(() => ({
              network,
              address,
              publicKey,
            }))
        )
    },
    showKeyDetail: ({ data: { params, callback } }) => {
      // Trigger C: App wants to display key detail screen
      // Input: { params: { platform: 'EQH', network: 'Equinehub', id: 'EQH-xxx-xxx-xxx-xxx' } }
      // Output: { hasKeyPair: true, hasPassphrase: false }

      const { platform, network, id: entryId } = params
      if (!platform) throw new Error(`invalid platform ${platform}`)
      if (!network) throw new Error(`invalid network ${network}`)
      if (!entryId) throw new Error(`invalid id ${entryId}`)

      return getKeyDetail(network, entryId)
        .catch(err => {
          // handle key is missing
          if (!err.message.includes('missing')) throw err
          // notify the parent window about key state before restore
          return callback(null, {
            hasKeyPair: false,
            hasPassphrase: false,
          }).then(() =>
            showRestoreMissingKeyScreen(platform, network, entryId).then(() =>
              getKeyDetail(network, entryId)
            )
          )
        })
        .then(
          keyDetail =>
            callback(null, {
              hasKeyPair: !!keyDetail.publicKey,
              hasPassphrase: !!keyDetail.passphraseImage,
            }).then(() => keyDetail)
          // error => callback(error) // callback to the parent window with error
        )
        .then(keyDetail => {
          const [div, promise] = KeyDetailScreen(document, keyDetail)
          contentDiv.innerHTML = ''
          contentDiv.appendChild(div)
          return promise.then(choice => {
            if (choice !== 'ok') throw new Error(choice)
            return keyDetail
          })
        })
        .then(keyDetail => ({
          network: keyDetail.network,
          address: keyDetail.address,
          publicKey: keyDetail.publicKey,
        }))
    },
    signTx: ({ data: { params, callback } }) => {
      // Trigger D: App wants to sign transaction
      // Input: { params: { platform: 'EQH', network: 'Equinehub', id: 'EQH-xxx-xxx-xxx-xxx', tx: {} } }
      // Output: { transactionBytes, transactionJSON, transactionFullHash }

      const { platform, network, id: entryId, tx } = params
      if (!platform) throw new Error(`invalid platform ${platform}`)
      if (!network) throw new Error(`invalid network ${network}`)
      if (!entryId) throw new Error(`invalid id ${entryId}`)
      if (typeof tx !== 'object') throw new Error(`invalid tx ${tx}`)

      return getKeyDetail(network, entryId)
        .catch(err => {
          // handle key is missing
          if (!err.message.includes('missing')) throw err
          // notify the parent window about key state before restore
          return callback(null, {
            hasKeyPair: false,
            hasPassphrase: false,
          }).then(() =>
            showRestoreMissingKeyScreen(platform, network, entryId).then(() =>
              getKeyDetail(network, entryId)
            )
          )
        })
        .then(
          keyDetail =>
            callback(null, {
              hasKeyPair: !!keyDetail.publicKey,
              hasPassphrase: !!keyDetail.passphraseImage,
            }).then(() => keyDetail)
          // error => callback(error) // callback to the parent window with error
        )
        .then(({ accountNo, address, hasPinProtection }) => {
          const [div, promise] = TxDetailScreen(
            document,
            platform,
            accountNo,
            address,
            tx,
            hasPinProtection
          )
          const loadingDiv = LoadingScreen(document, `Signing Transaction`)
          loadingDiv.classList.add('d-none')

          contentDiv.innerHTML = ''
          contentDiv.appendChild(div)
          contentDiv.appendChild(loadingDiv)

          return promise.then(([choice, pin]) => {
            if (choice !== 'ok') throw new Error('cancelled by user')

            div.classList.add('d-none')
            loadingDiv.classList.remove('d-none')

            return signTransaction(network, address, tx, pin)
          })
        })
        .then(txSigned => {
          contentDiv.innerHTML = ''
          contentDiv.appendChild(LoadingScreen(document, 'Posting Transaction'))
          return txSigned
        })
        .then(
          ({ transactionBytes, transactionJSON, transactionFullHash }) =>
            callback(null, {
              transactionBytes,
              transactionJSON,
              transactionFullHash,
            }).then(() => ({ hash: transactionFullHash }))
          // error => callback(error) // callback to the parent window with error
        )
        .then(res => {
          const message =
            'Transaction Signed. Thank you for using our Open-source Vault. You will be returned to the parent app.'
          const [div, promise] = SuccessScreen(document, 'Thank You', message, 1200)
          contentDiv.innerHTML = ''
          contentDiv.appendChild(div)
          return promise.then(() => res)
        })
    },
  }

  // On Load: Update key List
  updateKeyListDiv()
    .then(hasKeys => {
      // Create the welcome screen
      const welcomeDiv = WelcomeScreen(document, hasKeys)

      if (!window.opener) {
        // Show welcome screen on startup
        contentDiv.appendChild(welcomeDiv)

        // Add Event Listener: User clicks "Add Key" button in sidebar
        document.getElementById('goto-add-key-btn').addEventListener('click', () => {
          showAddKeyScreen()
            .then(() => updateKeyListDiv())
            .then(() => {
              contentDiv.innerHTML = ''
              contentDiv.appendChild(welcomeDiv)
            })
            .catch(error => {
              if (error.message !== 'cancelled by user') {
                window.alert(error.message || error)
              }
              contentDiv.innerHTML = ''
              contentDiv.appendChild(welcomeDiv)
            })
        })

        appendStylesheet('./css/main.default.css', document).then(() => {
          // Show the sidebar
          mainContent.classList.remove('offset-md-2')
          sidebarDiv.classList.remove('d-none')
          mainWrapper.classList.add('shadow-on')
        })
      } else {
        // Show some text while waiting for parent app
        contentDiv.textContent = 'Communicating with the parent app...'

        // Tell parent window vault is ready
        postRobot
          .sendToParent('vaultHandshake', { version: '1.3.0' })
          .then(
            event => {
              // Parent received the 'vaultHandshake' event.
              const {
                data: { version: desiredVersion, onReady },
                source: parentWindow,
                origin: originDomain,
              } = event

              try {
                console.info('vaultHandshake origin:', originDomain) // eslint-disable-line no-console
                const postRobotService = postRobot.listener({
                  window: parentWindow,
                  domain: originDomain,
                })

                const actualVersion = registerEvents(
                  postRobotService,
                  eventHandlers,
                  desiredVersion
                )

                return onReady(null, { version: actualVersion })
              } catch (err) {
                return onReady(err).then(() => {
                  throw err
                })
              }
            },
            error => {
              // Parent did not receive the 'vaultHandshake' event.
              console.error('vaultHandshake', error) // eslint-disable-line no-console
              contentDiv.textContent = `Problem communicating with the parent app. ${error.message}`
              throw error
            }
          )
          .then(
            ({ platform }) => {
              // Parent responded to the 'onReady' call.
              console.info('vaultReady') // eslint-disable-line no-console
              return platform
                ? appendStylesheet(`./css/main.${platform.toLowerCase()}.css`, document)
                : null
            },
            error => {
              // Parent did not receive the 'onReady' call.
              console.error('vaultReady', error) // eslint-disable-line no-console
              contentDiv.textContent = `Problem communicating with the parent app. ${error.message}`
              throw error
            }
          )
          .catch(() => setTimeout(() => window.close(), 30000))
      }
    })
    .catch(error => {
      console.error('Internal', error) // eslint-disable-line no-console
      window.alert(`Internal ${error.message || error}. Please try again.`)
    })
}
