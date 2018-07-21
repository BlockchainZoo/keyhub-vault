/* eslint-disable no-console, prefer-arrow-callback, no-undef */

import { safeHtml } from 'common-tags'

import postRobot from 'post-robot'

import Worker from './vault.worker'

export function loadVault(mainElement) { // eslint-disable-line
  // Load Webworker
  const worker = new Worker()

  const htmlTemplate = (safeHtml`<div class="col-md-6 col-lg-4 offset-lg-4 offset-md-3 fade-in">
    <div class="card animate-on-opacity" id="tx-detail">
      <div class="card-header text-center bg-secondary text-white">
        <h4><i class="fas fa-lock"></i> Transaction Detail</h4>
      </div>
      <div class="card-body">
        <div id="fetch-transaction-detail"></div>

        <div class="row justify-content-center col mt-5 mb-2">
          <button class="btn btn-primary px-4" id="sign-tx" disabled><i class="fas fa-sign-in-alt"></i> SIGN THIS</button>
        </div>

        <div class="row justify-content-center col mt-5 mb-2">
          <button class="btn btn-danger px-4" id="cancel-sign-tx">CANCEL</button>
        </div>
      </div>
    </div><!-- #sign-in-detail -->

    <div class="card hide-on-screen h-30 loader-wrapper align-items-center" id="loading-box">
        <div class="lds-roller">
            <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
          </div>
    </div><!-- #loading-box -->

    <div class="card hide-on-screen" id="tx-signing">
      <div class="card-header text-center bg-secondary text-white">
          <h4><i class="fas fa-broadcast-tower"></i> Signing Transaction</h4>
      </div>
      <div class="card-body"></div>
      <div class="justify-content-center flex-row align-items-center h-30 d-flex p-2">
          <div class="lds-roller">
            <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
          </div>
      </div>
    </div><!-- #sign-in-broadcasting -->

    <div class="card hide-on-screen" id="thank-you-card">
      <div class="card-header text-center bg-success text-white">
          <h4><i class="fas fa-check-square"></i> Thank You!</h4>
      </div>
      <div class="card-body">
          <p>Thank you for using Keyhub softwallet. Your transaction has been signed and returned to the main application.</p>
          <div class="text-center">
            <button class="btn btn-primary" id="back-to-app"><i class="fas fa-mobile-alt"></i> Back to app</button>
          </div>
      </div>
    </div><!-- #thank-you-card -->
  </div>`)

  mainElement.innerHTML = htmlTemplate // eslint-disable-line no-param-reassign

  const txDetail = document.getElementById('tx-detail')
  const txSigning = document.getElementById('tx-signing')
  const thankYouCard = document.getElementById('thank-you-card')

  const transactionDetail = document.getElementById('transaction-detail')
  const transactionSignBtn = document.getElementById('sign-tx')
  const transactionCancelSignBtn = document.getElementById('cancel-sign-tx')
  const backToAppBtn = document.getElementById('back-to-app')

  // eslint-disable-next-line no-restricted-globals
  transactionCancelSignBtn.addEventListener('click', () => self.close())
  // eslint-disable-next-line no-restricted-globals
  backToAppBtn.addEventListener('click', () => self.close())

  const displayTransaction = ({ type, data }) => {
    const domFragment = document.createDocumentFragment()

    transactionDetail.appendChild(domFragment)
    const divType = document.createElement('div')
    divType.appendChild(document.createTextNode(type))
    domFragment.appendChild(divType)

    Object.keys(data).forEach(function (key) {
      const div = document.createElement('div')
      div.classList.add('row', 'flex-nowrap', 'my-2')

      const divKey = document.createElement('div')
      divKey.classList.add('col-5')
      divKey.appendChild(document.createTextNode(key))

      const divColon = document.createElement('div')
      divColon.classList.add('col-1', 'd-none', 'd-md-flex')
      divColon.innerHTML = ':'

      const divVal = document.createElement('div')
      divVal.classList.add('col-6')
      divVal.appendChild(document.createTextNode(data[key]))

      div.appendChild(divKey)
      div.appendChild(divColon)
      div.appendChild(divVal)

      domFragment.appendChild(div)
    })

    return transactionDetail.appendChild(domFragment)
  }

  const signTransaction = (tx, callback) => {
    console.log(tx)

    worker.onerror = (error) => {
      // clear event listeners
      worker.onerror = null
      worker.onmessage = null

      // display error message on error
      const cardBody = txSigning.getElementsByClassName('card-body')[0]
      cardBody.appendChild(document.createTextNode(`Could not sign transaction: ${error.message || error}`))

      // call the function in the parent window once signed data is available
      callback(error).then(() => {
        setTimeout(() => {
          txSigning.style.display = 'none'
          txDetail.style.display = 'flex'
        }, 5000)
      }).catch((err) => {
        window.alert(`Could not return error to parent window: ${err.message || err}`)
        txSigning.style.display = 'none'
        txDetail.style.display = 'flex'
      })
    }

    worker.onmessage = ({ data }) => {
      // clear event listeners
      worker.onerror = null
      worker.onmessage = null

      // display error message on error
      if (data.errorCode) {
        const cardBody = txSigning.getElementsByClassName('card-body')[0]
        cardBody.appendChild(document.createTextNode(data.errorDescription))
        setTimeout(() => {
          txSigning.style.display = 'none'
          txDetail.style.display = 'flex'
        }, 5000)
        return
      }

      // call the function in the parent window once signed data is available
      callback(null, data).then(() => {
        txSigning.style.display = 'none'
        thankYouCard.style.display = 'flex'
      }).catch((error) => {
        window.alert(`Could not return result to parent window: ${error.message || error}`)
        txSigning.style.display = 'none'
        txDetail.style.display = 'flex'
      })
    }

    worker.postMessage(['signTransaction', tx.type, tx.data])

    txDetail.style.display = 'none'
    txSigning.style.display = 'flex'
  }

  if (window.opener) {
    postRobot.send(window.opener, 'vaultReady', { id: 1337 })
      .then((event) => {
        console.log(event.source, event.origin)
        const { data: { action, params, callback } } = event

        if (action === 'signTx' && params) {
          if (displayTransaction(...params)) {
            transactionSignBtn.addEventListener('click', () => signTransaction(tx, callback))
            transactionSignBtn.disabled = false
            transactionCancelSignBtn.disabled = false
          }
        } else if (action === 'generateKey' && params) {
          // TODO
        }
      })
      .catch((err) => {
        // Handle any errors that stopped our call from going through
        console.error(err)
      })
  } else {
    transactionDetail.appendChild(
      document.createTextNode('Transaction Detail not available. Please reopen this window/tab from the main app.')
    )

    // Testing code
    worker.onmessage = (event) => {
      const { data } = event
      console.log(data)
    }
    worker.postMessage(['generateKeyPair'])
  }
}
