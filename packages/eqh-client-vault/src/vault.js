/* eslint-disable no-console, prefer-arrow-callback, no-undef */

import { template } from 'lodash-es'

import postRobot from 'post-robot'

import Worker from './vault.worker'

export function loadVault(mainElement) { // eslint-disable-line
  // Load Webworker
  const worker = new Worker()

  const templateFn = template(`<div class="col-md-6 col-lg-4 offset-lg-4 offset-md-3 fade-in">
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

    <div class="card hide-on-screen" id="tx-broadcasting">
      <div class="card-header text-center bg-secondary text-white">
          <h4><i class="fas fa-broadcast-tower"></i> Broadcasting</h4>
      </div>
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
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris consectetur sollicitudin lacus sit amet lobortis. Duis consectetur lacinia sem. Sed vitae nulla pellentesque, porttitor mi vel, pulvinar turpis. </p>
          <div class="text-center">
            <button class="btn btn-primary" id="back-to-app"><i class="fas fa-mobile-alt"></i> Back to app</button>
          </div>
      </div>
    </div><!-- #thank-you-card -->
  </div>`)

  const templateVars = {}

  mainElement.innerHTML = templateFn(templateVars) // eslint-disable-line no-param-reassign

  const txDetail = document.getElementById('tx-detail')
  const txBroadcasting = document.getElementById('tx-broadcasting')
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
    worker.postMessage(['signTransaction', tx.type, tx.data])

    txDetail.style.display = 'none'
    txBroadcasting.style.display = 'flex'

    worker.onerror = (error) => {
      // clear event listeners
      worker.onerror = null
      worker.onmessage = null
      // call the function in the parent window once signed data is available
      callback(error).then(() => {
        window.alert(`Could not sign transaction: ${error.message || error}`)
      }).catch((err) => {
        window.alert(`Could not return error to parent window: ${err.message || err}`)
      })
    }

    worker.onmessage = ({ data }) => {
      // clear event listeners
      worker.onerror = null
      worker.onmessage = null
      // call the function in the parent window once signed data is available
      callback(null, data).then(() => {
        txBroadcasting.style.display = 'none'
        thankYouCard.style.display = 'flex'
      }).catch((error) => {
        window.alert(`Could not return result to parent window: ${error.message || error}`)
      })
    }

    // setTimeout(function () {
    //   txBroadcasting.style.display = 'none'
    //   thankYouCard.style.display = 'flex'
    // }, 5000)
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
    window.alert('Please reopen this window from the Main App.')

    // Testing code
    worker.onmessage = (event) => {
      const { data } = event
      console.log(data)
    }
    worker.postMessage(['generateKeyPair'])
  }
}
