/* eslint-disable no-console, prefer-arrow-callback, no-undef */

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

// Convert a callback function into a promise-returning function
// const promisify = func => (...args) => new Promise((resolve, reject) => {
//   func(...args, (err, res) => {
//     if (err) reject(err)
//     else resolve(res)
//   })
// })

export function loadVault(mainElement) { // eslint-disable-line
  // Load Webworker
  const worker = new Worker()

  const vaultLayoutHTML = (safeHtml`<div class="container fade-in">
    <div class="row shadow-on">
      <div class="sidebar col-md-3 bg-grey py-3" id="sidebar">
        <div class="block-title">
          Accounts
        </div>
        <div id="account-list"></div>
        <button class="btn btn-secondary btn-sm ml-1" id="goto-create-account-btn">Add Blockchain Account</button>
      </div>
      <div class="col-md-9 bg-white">
        <div class="entry-page py-3" id="content"></div>
      </div>
    </div>
  </div>`)

  mainElement.innerHTML = vaultLayoutHTML // eslint-disable-line no-param-reassign

  const content = document.getElementById('content')
  const welcomeDiv = WelcomeScreen(document)
  content.appendChild(welcomeDiv)

  const addAccountDiv = AddAccountScreen(document, (err, platform) => {
    if (err) return null
    content.innerHTML = ''
    content.appendChild(LoadingScreen(document, platform))

    worker.onmessage = ({ data }) => {
      const { secretPhrase } = data

      const displayPassphraseDiv = DisplayPassphraseScreen(document, secretPhrase, (err2, [choice, passphrase]) => {
        if (err2) return null
        if (choice === 'ok') {
          content.innerHTML = ''
          const hasLocalStorage = (typeof window.localStorage !== 'undefined')
          return content.appendChild(ConfirmPassphraseScreen(document, passphrase, hasLocalStorage, (err3, [choice3, pin]) => {
            if (err3) return null
            if (choice3 === 'ok') {
              worker.onmessage = ({ data: accountData }) => {
                // const { encryptedSecretPhrase, publicKey, accountId, accountRS } = accountData

                const accountsString = window.localStorage.getItem('accounts')
                const accounts = accountsString !== null
                  ? JSON.parse(accountsString)
                  : {}

                accounts.push(accountData)
                window.localStorage.setItem('accounts', JSON.stringify(accounts))
              }

              worker.postMessage(['encryptKeyPair', passphrase, pin])
            }

            content.innerHTML = ''
            return content.appendChild(welcomeDiv)
          }))
        }

        content.innerHTML = ''
        return content.appendChild(welcomeDiv)
      })

      content.innerHTML = ''
      content.appendChild(displayPassphraseDiv)
    }

    return worker.postMessage(['generateKeyPair'])
  })

  document.getElementById('goto-create-account-btn').addEventListener('click', () => {
    content.innerHTML = ''
    content.appendChild(addAccountDiv)
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
