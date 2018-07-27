
import { safeHtml } from 'common-tags'

import postRobot from 'post-robot'

import VaultWorker from './vault.worker'

import {
  WelcomeScreen,
  LoadingScreen,
  AddAccountScreen,
  DisplayPassphraseScreen,
  ConfirmPassphraseScreen,
  TxDetailScreen,
  ThankYouScreen,
} from './screen'

const { callOnStore } = require('./util/indexeddb')

export default function loadVault(window, document, mainElement) {
  // Load Webworker
  const worker = new VaultWorker()

  const vaultLayoutHTML = (safeHtml`<div class="container fade-in">
    <div class="row shadow-on">
      <div class="sidebar col-md-3 bg-grey py-3" id="sidebar">
        <div class="block-title">
          Accounts
        </div>
        <div id="account-list" class="account-list"></div>
        <button class="btn btn-secondary btn-sm ml-1" id="goto-create-account-btn">Add Key</button>
      </div>
      <div class="col-md-9 bg-white">
        <div class="entry-page py-3" id="content"></div>
      </div>
    </div>
  </div>`)

  mainElement.innerHTML = vaultLayoutHTML // eslint-disable-line no-param-reassign

  const contentDiv = document.getElementById('content')
  const accountListDiv = document.getElementById('account-list')

  let welcomeDiv = null

  const updateAccountListDiv = () => new Promise((resolve, reject) => {
    try {
      callOnStore('accounts', (store) => {
        const req = store.getAll()
        req.onsuccess = ({ target: { result } }) => {
          if (Array.isArray(result) && result.length > 0) {
            // Group by platform
            const accountsByPlatform = result.reduce((acc, i) => {
              const g = acc[i.platform]
              if (g) g.push(i)
              else acc[i.platform] = [i]
              return acc
            }, {})

            accountListDiv.innerHTML = ''
            Object.keys(accountsByPlatform).forEach((platform) => {
              const div = document.createElement('div')
              const h3 = document.createElement('h3')
              h3.appendChild(document.createTextNode(platform))
              div.appendChild(h3)

              const ul = document.createElement('ul')
              const accounts = accountsByPlatform[platform]
              accounts.forEach((account) => {
                const li = document.createElement('li')
                li.appendChild(document.createTextNode(account.address))
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

  const showGenerateKeyScreen = (platform) => {
    contentDiv.innerHTML = ''
    contentDiv.appendChild(LoadingScreen(document, `Generating Passphrase for ${platform}`))

    // call generatePassphrase on background webworker
    const promise = new Promise((resolve, reject) => {
      worker.onmessage = resolve
      worker.onerror = reject
      worker.postMessage(['generatePassphrase', 10])
    }).then(({ data: { error, passphrase } }) => {
      if (error) throw new Error(error)
      return passphrase
    })

    return promise
      .then(passphrase => new Promise((resolve, reject) => {
        contentDiv.innerHTML = ''
        contentDiv.appendChild(
          DisplayPassphraseScreen(document, passphrase, (err, res) => {
            if (err) reject(err)
            else resolve(res)
          })
        )
      }))
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
          contentDiv.appendChild(LoadingScreen(document, 'Encrypting your hashed Passphrase'))

          // call createKeyPair on background webworker
          return new Promise((resolve, reject) => {
            worker.onmessage = resolve
            worker.onerror = reject
            worker.postMessage(['createKeyPair', platform, `${platform.toLowerCase()}${passphrase}`, pin])
          }).then(({ data: { error, dbKey, accountId, accountRS, publicKey } }) => {
            if (error) throw new Error(error)
            return {
              dbKey,
              accountId,
              accountRS,
              publicKey,
            }
          })
        })
      })
  }

  const showAddAccountScreen = () => (
    new Promise((resolve, reject) => {
      contentDiv.innerHTML = ''
      contentDiv.appendChild(AddAccountScreen(document, (err, res) => {
        if (err) reject(err)
        else resolve(res)
      }))
    }).then(platform => showGenerateKeyScreen(platform))
  )

  const showTxDetailScreen = (platform, dbKey, tx) => {
    let txDetailDiv
    const promise = new Promise((resolve, reject) => {
      txDetailDiv = TxDetailScreen(document, platform, tx, (err, res) => {
        if (err) reject(err)
        else resolve(res)
      })
    })

    const loadingDiv = LoadingScreen(document, `Signing Transaction for ${platform}`)
    loadingDiv.classList.add('d-hide')

    contentDiv.innerHTML = ''
    contentDiv.appendChild(txDetailDiv)
    contentDiv.appendChild(loadingDiv)

    return promise
      .then(([choice, pin]) => {
        if (choice !== 'ok') throw new Error('cancelled by user')

        txDetailDiv.classList.add('d-hide')
        loadingDiv.classList.remove('d-hide')

        // call signTransaction on background webworker
        return new Promise((resolve, reject) => {
          worker.onmessage = resolve
          worker.onerror = reject
          worker.postMessage(['signTransaction', dbKey, pin, tx.type, tx.data])
        }).then(({ data: { error, signResponse } }) => {
          if (error) throw new Error(error)
          return { signResponse }
        })
      })
      .catch((error) => {
        // if (error.message === 'invalid pin') {
        //   loadingDiv.classList.add('d-hide')
        //   txDetailDiv.classList.remove('d-hide')

        //   return new Promise((resolve) => {
        //     txDetailDiv.querySelectorAll('button').forEach(b => (
        //       b.addEventListener('click', ev => resolve(ev.currentTarget.dataset.choice))
        //     ))
        //   })
        // }
        throw error
      })
  }

  updateAccountListDiv().then((hasAccounts) => {
    // Show welcome screen on startup
    welcomeDiv = WelcomeScreen(document, hasAccounts)
    contentDiv.appendChild(welcomeDiv)
  }).catch(() => {
    welcomeDiv = WelcomeScreen(document, false)
    contentDiv.appendChild(welcomeDiv)
  })

  // Trigger A: User Click "Add Key" Button
  document.getElementById('goto-create-account-btn').addEventListener('click', () => {
    showAddAccountScreen()
      .then(() => (
        updateAccountListDiv()
      )).then(() => {
        contentDiv.innerHTML = ''
        contentDiv.appendChild(welcomeDiv)
      })
      .catch((error) => {
        if (error.message !== 'cancelled by user') {
          alert(`Error: ${error.message || error}`) // eslint-disable-line
        }
        contentDiv.innerHTML = ''
        contentDiv.appendChild(welcomeDiv)
      })
  })

  if (window.opener) {
    postRobot.send(window.opener, 'vaultReady', { version: '1.0' }).then((event) => {
      // console.log(event.source, event.origin)
      // TODO: security checks on source/origin
      const { data: { action, params, callback } } = event

      // Trigger B: App wants to create new key for user
      if (action === 'newKey' && params) {
        const [platform] = params

        return showGenerateKeyScreen(platform)
          .then(({ dbKey, accountRS }) => (
            updateAccountListDiv().then(() => callback(null, { dbKey, accountRS }))
          ))
          .then(() => new Promise((resolve, reject) => {
            const message = 'Key Generated. Thank you for using Keyhub soft wallet. You will be returned to the main application.'
            contentDiv.innerHTML = ''
            contentDiv.appendChild(ThankYouScreen(document, message, (err, res) => {
              if (err) reject(err)
              else resolve(res)
            }))

            // Close the window after 5 seconds if no response from user
            window.setTimeout(() => {
              resolve('timeout')
            }, 5000)
          }))
          .then(() => self.close()) // eslint-disable-line
          .catch((error) => {
            if (error.message !== 'cancelled by user') {
              alert(`Error: ${error.message || error}`) // eslint-disable-line
            }

            // callback to the parent window on error
            callback(error).then(() => {
              self.close() // eslint-disable-line
            }).catch((err) => {
              window.alert(`Could not return error to parent window: ${err.message || err}`)
              self.close() // eslint-disable-line
            })
          })
      }

      // Trigger C: App wants to sign transaction
      if (action === 'signTx' && params) {
        const [platform, tx] = params

        return showTxDetailScreen(platform, null, tx)
          .then(({ signResponse }) => (
            // callback to the parent window once signed data is available
            callback(null, signResponse)
          ))
          .then(() => new Promise((resolve, reject) => {
            const message = 'Transaction Signed. Thank you for using Keyhub soft wallet. You will be returned to the main application.'
            contentDiv.innerHTML = ''
            contentDiv.appendChild(ThankYouScreen(document, message, (err, res) => {
              if (err) reject(err)
              else resolve(res)
            }))

            // Close the window after 5 seconds if no response from user
            window.setTimeout(() => {
              resolve('timeout')
            }, 5000)
          }))
          .then(() => self.close()) // eslint-disable-line
          .catch((error) => {
            if (error.message !== 'cancelled by user') {
              alert(`Error: ${error.message || error}`) // eslint-disable-line
            }

            // callback to the parent window on error
            callback(error).then(() => {
              self.close() // eslint-disable-line
            }).catch((err) => {
              window.alert(`Could not return error to parent window: ${err.message || err}`)
              self.close() // eslint-disable-line
            })
          })
      }

      return Promise.reject(new Error('Received unknown action from parent window.'))
    }).catch((error) => {
      // Handle any errors that stopped our call from going through
      console.error(error) // eslint-disable-line no-console
      window.alert(error.message || error)
    })
  }
}
