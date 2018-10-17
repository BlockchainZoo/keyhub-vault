import { safeHtml, stripIndent } from 'common-tags'

import postRobot from 'post-robot'

import pRetry from 'p-retry'

import VaultWorker from './vault.worker'

import {
  WelcomeScreen,
  LoadingScreen,
  AddAccountScreen,
  DisplayPassphraseScreen,
  ConfirmPassphraseScreen,
  ConfirmPhonenumScreen,
  TxDetailScreen,
  SuccessScreen,
  ErrorScreen,
  AccountDetail,
} from './screen'

const { callOnStore } = require('./util/indexeddb')

const { postMessage } = require('./util/webworker')

export default function loadVault(window, document, mainElement) {
  // workers from multiple platforms
  const workers = Object.create(null)

  const vaultLayoutHTML = safeHtml`<div class="container fade-in" id="mainWrapper">
    <div class="row" >
      <div class="sidebar col-md-4 bg-grey py-3 d-none" id="sidebar">
        <div class="block-title">Keys in this browser's wallet</div>
        <div id="account-list" class="account-list"></div>
        <button class="btn btn-secondary btn-sm ml-1" id="goto-add-account-btn">Add / Restore Key</button>
      </div>
      <div class="col-md-8 offset-md-2 bg-white main-content" id="mainContent">
        <div class="entry-page py-3" id="content"></div>
      </div>
    </div>
  </div>`

  mainElement.innerHTML = vaultLayoutHTML // eslint-disable-line no-param-reassign

  const contentDiv = document.getElementById('content')
  const sidebarDiv = document.getElementById('sidebar')
  const accountListDiv = document.getElementById('account-list')
  const mainWrapper = document.getElementById('mainWrapper')
  const mainContent = document.getElementById('mainContent')

  let welcomeDiv

  const configureAccount = (platform, address) => {
    // Lazy-Load Webworker
    if (!workers[platform]) workers[platform] = new VaultWorker()
    const worker = workers[platform]

    // call configure on background webworker
    return new Promise((resolve, reject) => {
      worker.onmessage = resolve
      worker.onerror = reject
      worker.postMessage(['configure', { address }])
    }).then(({ data: { error, config } }) => {
      if (error) throw Error(error)
      return config
    })
  }

  const showGenerateUnprotectedKeyScreen = (platform, phonenum) => {
    // Lazy-Load Webworker
    if (!workers[platform]) workers[platform] = new VaultWorker()
    const worker = workers[platform]

    const message = stripIndent`
      We will text the secret key to your phone for backup purpose.
      SMS might be intercepted by an unknown third-party.
    `

    const pubkey = stripIndent`
      -----BEGIN PGP PUBLIC KEY BLOCK-----
      Version: OpenPGP.js v3.0.12
      Comment: https://openpgpjs.org

      xjMEW1GeVRYJKwYBBAHaRw8BAQdAQv33J/0En2GVY2ug5Chtt3Gy/l7x+YDS
      lHmagHN2iqHNEUVRSCA8ZXFoQGJjei5hcHA+wncEEBYKACkFAltRnlUGCwkH
      CAMCCRBkr/3Wn8VKaQQVCAoCAxYCAQIZAQIbAwIeAQAASV4BAIiKu2nBrUxn
      b9jGhNNTjup0wCcBCAGNqnAokEVk6Kl6AP4gSLRfYTxh7BH+nsqeVT3lwyyQ
      n520BbEaXGQ0FFJBCM44BFtRnlUSCisGAQQBl1UBBQEBB0Bwbx8jPQbTMayu
      W01ssxLS3VyiYiJW16m9c7ubg4p+HwMBCAfCYQQYFggAEwUCW1GeVQkQZK/9
      1p/FSmkCGwwAAH0cAQCQdWgExzXATzF/LCwqb54NLKPL2vrFQY0V/ryyi6mP
      fQEA/HmvD8QGC18EuOAmk3UXaWyZMnFT3Fs08dcjqKr3uAg=
      =NzpF
      -----END PGP PUBLIC KEY BLOCK-----
    `

    const [div, promise] = ConfirmPhonenumScreen(document, phonenum, message)
    contentDiv.innerHTML = ''
    contentDiv.appendChild(div)

    return promise.then(([choice, phoneNumber]) => {
      contentDiv.innerHTML = ''
      contentDiv.appendChild(LoadingScreen(document, `Generating ${platform} Key`))

      return postMessage(worker, ['generatePassphrase', 10])
        .then(({ passphrase }) => `${platform.toLowerCase()} ${passphrase}`)
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
          return postMessage(worker, ['createUnprotectedKeyPair', passphrase]).then(
            ({ id, address, accountNo, publicKey }) =>
              !encPassphrase
                ? { id, address, accountNo, publicKey }
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
  }

  const showGenerateKeyScreen = platform => {
    contentDiv.innerHTML = ''
    contentDiv.appendChild(LoadingScreen(document, `Generating Passphrase for ${platform}`))

    // Lazy-Load Webworker
    if (!workers[platform]) workers[platform] = new VaultWorker()
    const worker = workers[platform]

    // call generatePassphrase on background webworker
    const p = new Promise((resolve, reject) => {
      worker.onmessage = resolve
      worker.onerror = reject
      worker.postMessage(['generatePassphrase', 10])
    }).then(({ data: { error, passphrase } }) => {
      if (error) throw new Error(error)
      return `${platform.toLowerCase()} ${passphrase}`
    })

    return p
      .then(
        passphrase =>
          new Promise((resolve, reject) => {
            contentDiv.innerHTML = ''
            contentDiv.appendChild(
              DisplayPassphraseScreen(document, passphrase, (err, res) => {
                if (err) reject(err)
                else resolve(res)
              })
            )
          })
      )
      .then(([choice, passphrase]) => {
        if (choice !== 'ok') throw new Error('cancelled by user')

        return new Promise((resolve, reject) => {
          contentDiv.innerHTML = ''
          contentDiv.appendChild(
            ConfirmPassphraseScreen(document, passphrase, true, (err, res) => {
              if (err) reject(err)
              else resolve(res)
            })
          )
        }).then(([choice2, pin]) => {
          if (choice2 !== 'ok') throw new Error('cancelled by user')

          contentDiv.innerHTML = ''
          contentDiv.appendChild(
            LoadingScreen(document, 'Securely Storing your Key in this Browser')
          )

          // call createKeyPair on background webworker
          return new Promise((resolve, reject) => {
            worker.onmessage = resolve
            worker.onerror = reject
            worker.postMessage(['createProtectedKeyPair', passphrase, pin])
          }).then(({ data: { error, id, address, accountNo, publicKey } }) => {
            if (error) throw new Error(error)
            return {
              id,
              address,
              accountNo,
              publicKey,
              pin,
            }
          })
        })
      })
  }

  const showAddAccountScreen = () =>
    new Promise((resolve, reject) => {
      contentDiv.innerHTML = ''
      contentDiv.appendChild(
        AddAccountScreen(document, (err, res) => {
          if (err) reject(err)
          else resolve(res)
        })
      )
    }).then(platform => showGenerateKeyScreen(platform))

  const showRestoreAccountScreen = (platform, address) =>
    new Promise((resolve, reject) => {
      const message = `You do not seem to have the private key for ${address} stored in this browser. Please restore the ${platform} key from backup.`
      contentDiv.appendChild(
        ErrorScreen(document, 'Key Missing', message, err => {
          if (err) reject(err)
          else reject(new Error('key missing'))
        })
      )
    })

  const showAccountDetailScreen = (platform, entryId) => {
    // Lazy-Load Webworker
    if (!workers[platform]) workers[platform] = new VaultWorker()
    const worker = workers[platform]

    // call configure on background webworker
    return new Promise((resolve, reject) => {
      worker.onmessage = resolve
      worker.onerror = reject
      worker.postMessage(['getKeyPair', entryId])
    }).then(({ data: { error, address, accountNo, publicKey, hasPassphrase } = {} }) => {
      if (error) throw new Error(error)
      if (!address) return showRestoreAccountScreen(platform, entryId)
      if (!hasPassphrase) {
        const accountDetail = {
          address,
          accountNo,
          publicKey,
        }
        contentDiv.innerHTML = ''
        contentDiv.appendChild(AccountDetail(document, accountDetail))

        return Promise.resolve(accountDetail)
      }

      return new Promise((resolve, reject) => {
        worker.onmessage = resolve
        worker.onerror = reject
        worker.postMessage(['getKeyPairPassphrase', entryId])
      }).then(({ data: { error2, passphrase } }) => {
        if (error2) throw Error(error2)
        const accountDetail = {
          address,
          accountNo,
          publicKey,
          passphrase,
        }
        contentDiv.innerHTML = ''
        contentDiv.appendChild(AccountDetail(document, accountDetail))

        return accountDetail
      })
    })
  }

  const showTxDetailScreen = (tx, platform, address) => {
    contentDiv.innerHTML = ''
    const loadingDiv = LoadingScreen(document, `Signing Transaction`)
    loadingDiv.classList.add('d-none')
    contentDiv.appendChild(loadingDiv)

    // Lazy-Load Webworker
    if (!workers[platform]) workers[platform] = new VaultWorker()
    const worker = workers[platform]

    return new Promise((resolve, reject) => {
      worker.onmessage = resolve
      worker.onerror = reject
      worker.postMessage(['getKeyPair', address])
    })
      .then(({ data: { error, accountNo } }) => {
        if (error) throw new Error(error)
        return accountNo
      })
      .then(accountNo => {
        if (!accountNo) {
          return showRestoreAccountScreen(platform, address)
        }

        return new Promise((resolve, reject) => {
          worker.onmessage = resolve
          worker.onerror = reject
          worker.postMessage(['configure', { address }])
        })
          .then(({ data: { error, config } }) => {
            if (error) throw Error(error)
            return config
          })
          .then(
            () =>
              new Promise((resolve, reject) => {
                const txDetailDiv = TxDetailScreen(
                  document,
                  platform,
                  accountNo,
                  address,
                  tx,
                  (err, res) => {
                    if (err) {
                      reject(err)
                    } else {
                      txDetailDiv.classList.add('d-none')
                      loadingDiv.classList.remove('d-none')
                      resolve(res)
                    }
                  }
                )
                contentDiv.appendChild(txDetailDiv)
              })
          )
          .then(([choice, pin]) => {
            if (choice !== 'ok') throw new Error('cancelled by user')

            // call signTransaction on background webworker
            return new Promise((resolve, reject) => {
              worker.onmessage = resolve
              worker.onerror = reject
              worker.postMessage(['signTransaction', address, pin, tx.type, tx.data])
            }).then(
              ({ data: { error, transactionJSON, transactionBytes, transactionFullHash } }) => {
                if (error) throw new Error(error)
                return { transactionJSON, transactionBytes, transactionFullHash }
              }
            )
          })
      })
  }

  const signMessage = (platform, address, message, optionalPin = null) => {
    // Lazy-Load Webworker
    if (!workers[platform]) workers[platform] = new VaultWorker()
    const worker = workers[platform]

    contentDiv.innerHTML = ''
    contentDiv.appendChild(LoadingScreen(document, 'Signing Document'))

    // call signMessage on background worker
    return new Promise((resolve, reject) => {
      worker.onmessage = resolve
      worker.onerror = reject
      worker.postMessage(['signMessage', address, message, optionalPin])
    }).then(({ data: { error, signature } }) => {
      if (error) throw new Error(error)
      return signature
    })
  }

  const updateAccountListDiv = () =>
    new Promise((resolve, reject) => {
      try {
        callOnStore('accounts', accounts => {
          const req = accounts.getAll()
          req.onsuccess = ({ target: { result: entries } }) => {
            if (Array.isArray(entries) && entries.length > 0) {
              // Group by platform
              const accountsByPlatform = entries.reduce((acc, entry) => {
                const g = acc[entry.platform]
                if (g) g.push(entry)
                else acc[entry.platform] = [entry]
                return acc
              }, {})

              // onClick handler for <ul/>
              const onClick = ul => ({ target: { type, dataset, classList } }) => {
                if (type === 'button' && dataset) {
                  const { platform, address, entryId } = dataset
                  // const entry = entries.find(e => e.platform === platform && e.address === address)
                  configureAccount(platform, address)
                    .then(() => {
                      ul.querySelectorAll('button').forEach(
                        li => li.classList.remove('btn-dark') && li.classList.add('btn-light')
                      )
                      classList.remove('btn-light')
                      classList.add('btn-dark')
                      showAccountDetailScreen(platform, entryId)
                    })
                    .catch(error => {
                      window.alert(`Error: ${error.message || error}`)
                    })
                }
              }

              accountListDiv.innerHTML = ''
              Object.keys(accountsByPlatform).forEach(platform => {
                const div = document.createElement('div')
                const h3 = document.createElement('h3')
                h3.appendChild(document.createTextNode(platform))
                div.appendChild(h3)
                const ul = document.createElement('ul')
                ul.addEventListener('click', onClick(ul))

                const plaformAccounts = accountsByPlatform[platform]
                plaformAccounts.forEach(entry => {
                  const li = document.createElement('li')
                  const button = document.createElement('button') // eslint-disable-line
                  button.type = 'button'
                  button.classList.add('btn', 'btn-light')
                  button.appendChild(document.createTextNode(entry.address))
                  button.dataset.platform = entry.platform
                  button.dataset.address = entry.address
                  button.dataset.entryId = entry.id
                  li.appendChild(button)
                  ul.appendChild(li)
                })

                div.appendChild(ul)
                accountListDiv.appendChild(div)
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

  // Add Event Listener: User clicks "Add Key" Button
  document.getElementById('goto-add-account-btn').addEventListener('click', () => {
    showAddAccountScreen()
      .then(() => updateAccountListDiv())
      .then(() => {
        contentDiv.innerHTML = ''
        contentDiv.appendChild(welcomeDiv)
      })
      .catch(error => {
        if (error.message !== 'cancelled by user') {
          window.alert(`Error: ${error.message || error}`)
        }
        contentDiv.innerHTML = ''
        contentDiv.appendChild(welcomeDiv)
      })
  })

  // Handle Cross-Tab Actions from postRobot
  const triggerAction = (action, params, callback) => {
    // Trigger A: App wants to create new unprotected key for user
    // Input: { action: 'newUnprotectedKeyAndSign', params: [ 'EQH', messageHex, phoneNumber ] }
    // Output: { publicKey, signature }
    if (action === 'newUnprotectedKeyAndSign' && params) {
      const [platform, messageHex, phoneNum] = params

      return showGenerateUnprotectedKeyScreen(platform, phoneNum)
        .then(res => updateAccountListDiv().then(() => res))
        .then(({ address, publicKey, phoneNumber, encPassphrase }) =>
          signMessage(platform, address, messageHex).then(signature => {
            contentDiv.innerHTML = ''
            contentDiv.appendChild(LoadingScreen(document, 'Registering Key'))
            // callback to the parent window with result
            const run = () =>
              callback(null, {
                publicKey,
                signature,
                phoneNumber,
                encPassphrase,
              })
            return pRetry(run, {
              retries: 10,
              factor: 1.71,
              onFailedAttempt: error => {
                contentDiv.innerHTML = ''
                contentDiv.appendChild(
                  LoadingScreen(
                    document,
                    `Registering Key (attempt: ${error.attemptNumber})`,
                    `Error in Main App: ${error.message || error}`
                  )
                )
              },
            })
          })
        )
        .then(() => self.close()) // eslint-disable-line
        .catch(error => {
          if (error.message !== 'cancelled by user') {
            window.alert(`Error: ${error.message || error}`)
          }

          // callback to the parent window on error
          callback(error)
            .then(() => {
              self.close() // eslint-disable-line
            })
            .catch(err => {
              window.alert(`Could not return error to parent window: ${err.message || err}`)
              self.close() // eslint-disable-line
            })
        })
    }

    // Trigger B: App wants to create new key for user
    // Input: { action: 'newKeyAndSign', params: [ 'EQH', messageHex ] }
    // Output: { publicKey, signature }
    if (action === 'newKeyAndSign' && params) {
      const [platform, messageHex] = params

      return showGenerateKeyScreen(platform)
        .then(res => updateAccountListDiv().then(() => res))
        .then(({ address, publicKey, pin }) =>
          signMessage(platform, address, messageHex, pin).then(signature => {
            contentDiv.innerHTML = ''
            contentDiv.appendChild(LoadingScreen(document, 'Registering Key'))
            // callback to the parent window with result
            const run = () =>
              callback(null, {
                publicKey,
                signature,
              })
            return pRetry(run, {
              retries: 10,
              factor: 1.71,
              onFailedAttempt: error => {
                contentDiv.innerHTML = ''
                contentDiv.appendChild(
                  LoadingScreen(
                    document,
                    `Registering Key (attempt: ${error.attemptNumber})`,
                    `Error in Main App: ${error.message || error}`
                  )
                )
              },
            })
          })
        )
        .then(
          () =>
            new Promise((resolve, reject) => {
              const message =
                'Key Added. Thank you for using our Open-source Vault. You will be returned to the main app.'
              contentDiv.innerHTML = ''
              contentDiv.appendChild(
                SuccessScreen(document, 'Thank You', message, (err, res) => {
                  if (err) reject(err)
                  else resolve(res)
                })
              )

              // Close the window after 5 seconds if no response from user
              window.setTimeout(() => {
                resolve('timeout')
              }, 5000)
            })
        )
        .then(() => self.close()) // eslint-disable-line
        .catch(error => {
          if (error.message !== 'cancelled by user') {
            window.alert(`Error: ${error.message || error}`)
          }

          // callback to the parent window on error
          callback(error)
            .then(() => {
              self.close() // eslint-disable-line
            })
            .catch(err => {
              window.alert(`Could not return error to parent window: ${err.message || err}`)
              self.close() // eslint-disable-line
            })
        })
    }

    // Trigger C: App wants to display account detail screen
    // Input: { action: 'showKeyDetail', params: [ 'EQH', 'EQH-xxx-xxx-xxx-xxx' ] }
    // Output: { hasKeyPair: true, hasPassphrase: false }
    if (action === 'showKeyDetail' && params) {
      const [platform, address] = params

      return showAccountDetailScreen(platform, address)
        .then(({ publicKey, passphrase }) => {
          // callback to the parent window with result
          callback(null, {
            hasKeyPair: !!publicKey,
            hasPassphrase: !!passphrase,
          })
        })
        .catch(error => {
          if (error.message !== 'key missing') {
            window.alert(`Error: ${error.message || error}`) // eslint-disable-line
          }

          // callback to the parent window on error
          callback(error).catch(err => {
            window.alert(`Could not return error to parent window: ${err.message || err}`)
            self.close() // eslint-disable-line
          })
        })
    }

    // Trigger D: App wants to sign transaction
    // Input: { action: 'signTx', params: [ 'EQH', 'EQH-xxx-xxx-xxx-xxx', tx ] }
    // Output: { transactionBytes, transactionJSON, transactionFullHash }
    if (action === 'signTx' && params) {
      const [platform, address, tx] = params

      return showTxDetailScreen(tx, platform, address)
        .then(({ transactionBytes, transactionJSON, transactionFullHash }) => {
          contentDiv.innerHTML = ''
          contentDiv.appendChild(LoadingScreen(document, 'Verifying Transaction'))
          // callback to the parent window with result
          const run = () =>
            callback(null, {
              transactionBytes,
              transactionJSON,
              transactionFullHash,
            })
          return pRetry(run, {
            retries: 10,
            factor: 1.71,
            onFailedAttempt: error => {
              contentDiv.innerHTML = ''
              contentDiv.appendChild(
                LoadingScreen(
                  document,
                  `Verifying Transaction (attempt: ${error.attemptNumber})`,
                  `Error in Main App: ${error.message || error}`
                )
              )
            },
          })
        })
        .then(
          () =>
            new Promise((resolve, reject) => {
              const message =
                'Transaction Signed. Thank you for using our Open-source Vault. You will be returned to the main app.'
              contentDiv.innerHTML = ''
              contentDiv.appendChild(
                SuccessScreen(document, 'Thank You', message, (err, res) => {
                  if (err) reject(err)
                  else resolve(res)
                })
              )

              // Close the window after 5 seconds if no response from user
              window.setTimeout(() => {
                resolve('timeout')
              }, 5000)
            })
        )
        .then(() => self.close()) // eslint-disable-line
        .catch(error => {
          if (error.message !== 'cancelled by user' || error.message !== 'key missing') {
            window.alert(`Error: ${error.message || error}`) // eslint-disable-line
          }

          // callback to the parent window on error
          callback(error)
            .then(() => {
              self.close() // eslint-disable-line
            })
            .catch(err => {
              window.alert(`Could not return error to parent window: ${err.message || err}`)
              self.close() // eslint-disable-line
            })
        })
    }

    return Promise.reject(new Error('Received unknown action from parent window.'))
  }

  const appendStylesheet = href =>
    new Promise((resolve, reject) => {
      const linkElement = document.createElement('link')
      linkElement.type = 'text/css'
      linkElement.rel = 'stylesheet'
      linkElement.href = href
      linkElement.onload = resolve
      linkElement.onerror = reject
      document.head.appendChild(linkElement)
    })

  // On Load: Update Account List
  updateAccountListDiv()
    .then(hasAccounts => {
      // Create the welcome screen
      welcomeDiv = WelcomeScreen(document, hasAccounts)

      if (!window.opener) {
        // Show welcome screen on startup
        contentDiv.appendChild(welcomeDiv)

        appendStylesheet('./css/main.default.css').then(() => {
          // Show the sidebar
          mainContent.classList.remove('offset-md-2')
          sidebarDiv.classList.remove('d-none')
          mainWrapper.classList.add('shadow-on')
        })
      } else {
        // Tell parent window vault is ready
        postRobot
          .send(window.opener, 'vaultReady', { version: '1.0' })
          .then(event => {
            // console.log(event.source, event.origin)
            // TODO: security checks on source/origin
            const {
              data: { style = 'EQH', action, params, callback },
            } = event

            if (style) {
              return appendStylesheet(`./css/main.${style.toLowerCase()}.css`).then(() =>
                triggerAction(action, params, callback)
              )
            }
            // else
            return triggerAction(action, params, callback)
          })
          .catch(error => {
            // Handle any errors that stopped our call from going through
            console.error(error) // eslint-disable-line no-console
            window.alert(error.message || error)
          })
      }
    })
    .catch(error => {
      window.alert(`Fatal Error: ${error.message || error}. Please try again.`)
    })
}
