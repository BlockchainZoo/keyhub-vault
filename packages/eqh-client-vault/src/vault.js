
import { safeHtml } from 'common-tags'

// import postRobot from 'post-robot'

import Worker from './vault.worker'

import {
  WelcomeScreen,
  LoadingScreen,
  AddAccountScreen,
  DisplayPassphraseScreen,
  ConfirmPassphraseScreen,
} from './screen'

const { callOnStore } = require('./util/indexeddb')

export default function loadVault(document, mainElement) {
  // Load Webworker
  const worker = new Worker()

  const vaultLayoutHTML = (safeHtml`<div class="container fade-in">
    <div class="row shadow-on">
      <div class="sidebar col-md-3 bg-grey py-3" id="sidebar">
        <div class="block-title">
          Accounts
        </div>
        <div id="account-list"></div>
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
              const ul = document.createElement('ul')
              const accounts = accountsByPlatform[platform]
              accounts.forEach((account) => {
                const li = document.createElement('li')
                li.appendChild(document.createTextNode(account.address))
                ul.appendChild(li)
              })
              accountListDiv.appendChild(ul)
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

  const showAddAccountScreen = () => (
    Promise.resolve()
      .then(() => new Promise((resolve, reject) => {
        contentDiv.innerHTML = ''
        contentDiv.appendChild(AddAccountScreen(document, (err, res) => {
          if (err) reject(err)
          else resolve(res)
        }))
      }))
      .then((platform) => {
        contentDiv.innerHTML = ''
        contentDiv.appendChild(LoadingScreen(document, `Generating SecretPhrase for ${platform}`))

        const promise = new Promise((resolve, reject) => {
          worker.onmessage = resolve
          worker.onerror = reject
          worker.postMessage(['generateSecretPhrase', 10])
        }).then(({ data: { error, secretPhrase } }) => {
          if (error) throw new Error(error)
          return secretPhrase
        })

        return Promise.resolve(promise)
          .then(secretPhrase => new Promise((resolve, reject) => {
            contentDiv.innerHTML = ''
            contentDiv.appendChild(
              DisplayPassphraseScreen(document, secretPhrase, (err, res) => {
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
              contentDiv.appendChild(LoadingScreen(document, 'Encrypting your SecretPhrase'))

              return new Promise((resolve, reject) => {
                worker.onmessage = resolve
                worker.onerror = reject
                worker.postMessage(['storeKeyPair', platform, `${platform.toLowerCase()}${passphrase}`, pin])
              }).then(({ data: { error, accountId, accountRS, publicKey } }) => {
                if (error) throw new Error(error)
                return { accountId, accountRS, publicKey }
              })
            })
          })
      })
  )


  updateAccountListDiv().then((hasAccounts) => {
    // Show welcome screen on startup
    welcomeDiv = WelcomeScreen(document, hasAccounts)
    contentDiv.appendChild(welcomeDiv)
  }).catch(() => {
    welcomeDiv = WelcomeScreen(document, false)
    contentDiv.appendChild(welcomeDiv)
  })

  document.getElementById('goto-create-account-btn').addEventListener('click', () => {
    showAddAccountScreen()
      .then(({ accountRS, publicKey }) => {
        console.log(accountRS, publicKey)
        updateAccountListDiv()
        contentDiv.innerHTML = ''
        contentDiv.appendChild(welcomeDiv)
      })
      .catch((err) => {
        if (err.message !== 'cancelled by user') {
          alert(`Error: ${err.message || err}`) // eslint-disable-line
        }
        contentDiv.innerHTML = ''
        contentDiv.appendChild(welcomeDiv)
      })
  })

  // if (window.opener) {
  //   postRobot.send(window.opener, 'vaultReady', { id: 1337 })
  //     .then((event) => {
  //       console.log(event.source, event.origin)
  //       const { data: { action, params, callback } } = event

  //       if (action === 'signTx' && params) {
  //         const tx = params[0]
  //         if (displayTransaction(tx)) {
  //           transactionSignBtn.addEventListener('click', () => signTransaction(tx, callback))
  //           transactionSignBtn.disabled = false
  //           transactionCancelSignBtn.disabled = false
  //         }
  //       } else if (action === 'generateKey' && params) {
  //         // TODO
  //       }
  //     })
  //     .catch((err) => {
  //       // Handle any errors that stopped our call from going through
  //       console.error(err)
  //     })
  // }
}
