
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
  SuccessScreen,
  ErrorScreen,
} from './screen'

const { callOnStore } = require('./util/indexeddb')

export default function loadVault(window, document, mainElement) {
  // workers from multiple platforms
  const workers = Object.create(null)

  const vaultLayoutHTML = (safeHtml`<div class="container fade-in">
    <div class="row shadow-on">
      <div class="sidebar col-md-3 bg-grey py-3" id="sidebar">
        <div class="block-title">Private Keys (in this browser)</div>
        <div id="account-list" class="account-list"></div>
        <button class="btn btn-secondary btn-sm ml-1" id="goto-add-account-btn">Add Key</button>
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
              ul.addEventListener('click', ({ target }) => {
                if (target.type === 'button' && target.dataset) {
                  const { dataset: { address } } = target
                  configureAccount(platform, address).then(() => {
                    ul.querySelectorAll('button').forEach(li => li.classList.remove('btn-dark') && li.classList.add('btn-light'))
                    target.classList.remove('btn-light')
                    target.classList.add('btn-dark')
                  }).catch((error) => {
                    window.alert(`Error: ${error.message || error}`)
                  })
                }
              })

              const accounts = accountsByPlatform[platform]
              accounts.forEach((account) => {
                const li = document.createElement('li')
                const button = document.createElement('button') // eslint-disable-line
                button.classList.add('btn', 'btn-light')
                button.appendChild(document.createTextNode(account.address))
                button.dataset.address = account.address
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

  const showGenerateKeyScreen = (platform) => {
    contentDiv.innerHTML = ''
    contentDiv.appendChild(LoadingScreen(document, `Generating Passphrase for ${platform}`))

    // Lazy-Load Webworker
    if (!workers[platform]) workers[platform] = new VaultWorker()
    const worker = workers[platform]

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
            worker.postMessage(['createKeyPair', `${platform.toLowerCase()}${passphrase}`, pin])
          }).then(({ data: { error, address, accountNo, publicKey } }) => {
            if (error) throw new Error(error)
            return {
              address,
              accountNo,
              publicKey,
              pin,
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

  const signMessage = (platform, address, pin, message) => {
    // Lazy-Load Webworker
    if (!workers[platform]) workers[platform] = new VaultWorker()
    const worker = workers[platform]

    // call signMessage on background worker
    return new Promise((resolve, reject) => {
      worker.onmessage = resolve
      worker.onerror = reject
      worker.postMessage(['signMessage', address, pin, message])
    }).then(({ data: { error, signature } }) => {
      if (error) throw new Error(error)
      return { signature }
    })
  }

  const showTxDetailScreen = (tx, platform, address) => {
    contentDiv.innerHTML = ''
    const loadingDiv = LoadingScreen(document, `Signing Transaction for ${platform}`)
    loadingDiv.classList.add('d-none')
    contentDiv.appendChild(loadingDiv)

    // Lazy-Load Webworker
    if (!workers[platform]) workers[platform] = new VaultWorker()
    const worker = workers[platform]

    return new Promise((resolve, reject) => {
      worker.onmessage = resolve
      worker.onerror = reject
      worker.postMessage(['hasKeyPair', address])
    }).then(({ data: { error, hasKeyPair } }) => {
      if (error) throw new Error(error)
      return hasKeyPair
    }).then((hasKeyPair) => {
      if (!hasKeyPair) {
        return new Promise((resolve, reject) => {
          const message = 'You do not seem to have this private key stored in this browser. Please use your other browser or computer. To restore a key from backup, click the "Add Key" button.'
          contentDiv.appendChild(ErrorScreen(document, 'Key Missing', message, (err) => {
            if (err) reject(err)
            else reject(new Error('key missing'))
          }))
        })
      }

      return new Promise((resolve, reject) => {
        const txDetailDiv = TxDetailScreen(document, platform, tx, (err, res) => {
          if (err) {
            reject(err)
          } else {
            txDetailDiv.classList.add('d-none')
            loadingDiv.classList.remove('d-none')
            resolve(res)
          }
        })
        contentDiv.appendChild(txDetailDiv)
      }).then(([choice, pin]) => {
        if (choice !== 'ok') throw new Error('cancelled by user')

        // call signTransaction on background webworker
        return new Promise((resolve, reject) => {
          worker.onmessage = resolve
          worker.onerror = reject
          worker.postMessage(['signTransaction', address, pin, tx.type, tx.data])
        }).then(({ data: { error, signResponse } }) => {
          if (error) throw new Error(error)
          return { signResponse }
        })
      }).catch((error) => {
        // if (error.message === 'invalid pin') {
        //   loadingDiv.classList.add('d-none')
        //   txDetailDiv.classList.remove('d-none')

        //   return new Promise((resolve) => {
        //     txDetailDiv.querySelectorAll('button').forEach(b => (
        //       b.addEventListener('click', ev => resolve(ev.currentTarget.dataset.choice))
        //     ))
        //   })
        // }
        throw error
      })
    })
  }

  // Trigger A: User Click "Add Key" Button
  document.getElementById('goto-add-account-btn').addEventListener('click', () => {
    showAddAccountScreen()
      .then(() => (
        updateAccountListDiv()
      )).then(() => {
        contentDiv.innerHTML = ''
        contentDiv.appendChild(welcomeDiv)
      })
      .catch((error) => {
        if (error.message !== 'cancelled by user') {
          window.alert(`Error: ${error.message || error}`)
        }
        contentDiv.innerHTML = ''
        contentDiv.appendChild(welcomeDiv)
      })
  })

  updateAccountListDiv().then((hasAccounts) => {
    // Create the welcome screen
    welcomeDiv = WelcomeScreen(document, hasAccounts)

    if (!window.opener) {
      // Show welcome screen on startup
      contentDiv.appendChild(welcomeDiv)
    } else {
      // Tell parent window vault is ready
      postRobot.send(window.opener, 'vaultReady', { version: '1.0' }).then((event) => {
        // console.log(event.source, event.origin)
        // TODO: security checks on source/origin
        const { data: { action, params, callback } } = event

        // Trigger B: App wants to create new key for user
        // Input: { action: 'newKeyAndSign', params: [ 'EQH', messageToSign ] }
        // Output: { publicKey, signature }
        if (action === 'newKeyAndSign' && params) {
          const [platform, messageToSign] = params

          return showGenerateKeyScreen(platform)
            .then(({ address, publicKey, pin }) => (
              signMessage(platform, address, pin, messageToSign).then(signature => (
                updateAccountListDiv().then(() => callback(null, {
                  publicKey,
                  signature,
                }))
              ))
            ))
            .then(() => new Promise((resolve, reject) => {
              const message = 'Key Generated. Thank you for using Keyhub soft wallet. You will be returned to the main application.'
              contentDiv.innerHTML = ''
              contentDiv.appendChild(SuccessScreen(document, 'Thank You', message, (err, res) => {
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
                window.alert(`Error: ${error.message || error}`)
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
        // Input: { action: 'signTx', params: [ 'EQH', 'EQH-xxx-xxx-xxx-xxx', tx ] }
        // Output: { transactionBytes, transactionJSON }
        if (action === 'signTx' && params) {
          const [platform, address, tx] = params

          return showTxDetailScreen(tx, platform, address)
            .then(({ signResponse }) => (
              // callback to the parent window once signed data is available
              callback(null, signResponse)
            ))
            .then(() => new Promise((resolve, reject) => {
              const message = 'Transaction Signed. Thank you for using Keyhub soft wallet. You will be returned to the main application.'
              contentDiv.innerHTML = ''
              contentDiv.appendChild(SuccessScreen(document, 'Thank You', message, (err, res) => {
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
              if (error.message !== 'cancelled by user' || error.message !== 'key missing') {
                window.alert(`Error: ${error.message || error}`) // eslint-disable-line
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
  }).catch((error) => {
    window.alert(`Fatal Error: ${error.message || error}. Please try again.`)
  })
}
