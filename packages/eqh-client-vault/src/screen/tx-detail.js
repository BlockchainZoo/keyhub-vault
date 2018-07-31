import { safeHtml, html } from 'common-tags'

const validatePin = (pinInput, pinAlert) => {
  /* eslint-disable no-param-reassign */
  const pinInputTrim = pinInput.value.trim()
  if (pinInputTrim) {
    pinAlert.classList.remove('d-block')
    pinAlert.classList.add('d-hide')
    pinAlert.innerHTML = ''
    return true
  }

  pinInput.classList.add('is-invalid')
  pinAlert.innerHTML = "Pin can't be empty!"
  pinAlert.classList.add('invalid-feedback', 'd-block')
  return false
}

const displayTransaction = (document, detailDiv, { type, data }) => {
  const domFragment = document.createDocumentFragment()

  const divTxType = document.createElement('div')
  divTxType.appendChild(document.createTextNode(type))
  domFragment.appendChild(divTxType)

  Object.keys(data).forEach((key) => {
    const divRow = document.createElement('div')
    divRow.classList.add('row', 'flex-nowrap', 'my-2')

    const divKey = document.createElement('div')
    divKey.classList.add('col-5')
    divKey.appendChild(document.createTextNode(key))

    const divColon = document.createElement('div')
    divColon.classList.add('col-1', 'd-none', 'd-md-flex')
    divColon.innerHTML = ':'

    const divVal = document.createElement('div')
    divVal.classList.add('col-6')
    divVal.appendChild(document.createTextNode(data[key]))

    divRow.appendChild(divKey)
    divRow.appendChild(divColon)
    divRow.appendChild(divVal)

    domFragment.appendChild(divRow)
  })

  detailDiv.appendChild(domFragment)
}

export default function createElement(document, platform, accountNo, tx, callback) {
  const div = document.createElement('div')

  const pinForm = (safeHtml`
    <div class="form-group">
      <label for="text-pin">Security Pin: </label><br>
      <input type="password" class="form-control" id="pin-input" />
    </div>
    <div id="pin-alert" class="d-hide form-group"></div>
  `)

  div.innerHTML = (html`
  <div class="card-header text-center bg-secondary text-white">
    <h4><i class="fas fa-lock"></i> ${platform} Transaction Detail</h4>
  </div>
  <div class="card-body">
    <div>Your Account No.: ${accountNo}</div>
    <div id="transaction-detail"></div>

    ${pinForm}

    <div class="row justify-content-center col mt-5 mb-2">
      <button class="btn btn-primary px-4" id="sign-tx" data-choice="ok"><i class="fas fa-sign-in-alt"></i> SIGN THIS</button>
    </div>
    <div class="row justify-content-center col mt-5 mb-2">
      <button class="btn btn-danger px-4" id="cancel-sign-tx" data-choice="cancel">CANCEL</button>
    </div>
  </div>`)

  const pinInput = div.querySelector('#pin-input')
  const pinAlert = div.querySelector('#pin-alert')
  const transactionDetailDiv = div.querySelector('#transaction-detail')
  displayTransaction(document, transactionDetailDiv, tx)

  const verifyChoice = (choice) => {
    if (choice === 'ok') {
      const isValid = validatePin(pinInput, pinAlert)
      if (!isValid) return
    }

    callback(null, [choice, pinInput.value.trim()])
  }

  if (callback) {
    div.querySelectorAll('button').forEach(b => (
      b.addEventListener('click', ev => verifyChoice(ev.currentTarget.dataset.choice))
    ))
  }

  return div
}
