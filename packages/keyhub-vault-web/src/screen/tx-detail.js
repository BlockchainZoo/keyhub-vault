import { safeHtml, html } from 'common-tags'

const validatePin = (pinInput, pinAlert) => {
  /* eslint-disable no-param-reassign */
  const pinInputTrim = pinInput.value.trim()
  if (pinInputTrim) {
    pinAlert.classList.remove('d-block')
    pinAlert.classList.add('d-none')
    pinAlert.innerHTML = ''
    return true
  }

  pinInput.classList.add('is-invalid')
  pinAlert.innerHTML = "Pin can't be empty!"
  pinAlert.classList.add('invalid-feedback', 'd-block')
  return false
}

const splitNumber = accountNo => {
  const str = accountNo.toString()
  const result = [str[0]]

  for (let x = 1; x < str.length; x += 1) {
    if (x % 5 === 0) {
      result.push('.', str[x])
    } else {
      result.push(str[x])
    }
  }
  return result.join('')
}

const displayTransaction = (document, detailDiv, { type, data }) => {
  const domFragment = document.createDocumentFragment()
  let txData = ''

  const divTxTypeRow = document.createElement('div')
  divTxTypeRow.classList.add('row', 'my-2', 'border-bottom', 'py-3')

  const divTxTypeLabel = document.createElement('div')
  divTxTypeLabel.classList.add('col-sm-4', 'text-capitalize', 'text-strong')
  divTxTypeLabel.appendChild(document.createTextNode('Type'))

  // const divTxIcon = document.createElement('div')
  // divTxIcon.classList.add('bullet-icon')

  const divTxIconFa = document.createElement('i')
  divTxIconFa.classList.add('fas', 'fa-money-bill-alt', 'text-secondary', 'mr-2')
  // divTxIcon.appendChild(divTxIconFa)

  const divTxType = document.createElement('div')
  divTxType.classList.add('col-sm-8', 'text-grey')

  divTxType.appendChild(divTxIconFa)
  divTxType.appendChild(document.createTextNode(type))

  divTxTypeRow.appendChild(divTxTypeLabel)
  divTxTypeRow.appendChild(divTxType)
  domFragment.appendChild(divTxTypeRow)

  Object.keys(data).forEach(key => {
    const divRow = document.createElement('div')
    divRow.classList.add('row', 'my-2', 'border-bottom', 'py-3')

    const divKey = document.createElement('div')
    divKey.classList.add('col-sm-4', 'text-capitalize', 'text-strong')

    divKey.appendChild(document.createTextNode(key))

    // const divColon = document.createElement('div')
    // divColon.classList.add('col-sm-1', 'd-none', 'd-sm-flex')
    // divColon.innerHTML = ':'

    const divVal = document.createElement('div')
    divVal.classList.add('col-sm-8', 'text-grey')

    txData = key === 'recipient' ? splitNumber(data[key]) : data[key]

    divVal.appendChild(document.createTextNode(txData))

    divRow.appendChild(divKey)
    // divRow.appendChild(divColon)
    divRow.appendChild(divVal)

    domFragment.appendChild(divRow)
  })

  detailDiv.appendChild(domFragment)
}

export default function createElement(document, platform, accountNo, address, tx) {
  const div = document.createElement('div')

  const pinForm = safeHtml`
    <div class="form-group">
      <label for="text-pin">Security Pin: </label><br>
      <input type="password" class="form-control" id="pin-input" />
    </div>
    <div id="pin-alert" class="d-none form-group"></div>
  `

  div.innerHTML = html`
  <div class="card-header text-center bg-secondary text-white">
    <h4 class="mb-2"><i class="fas fa-lock"></i> ${platform} Transaction Detail</h4>
    <p class="mb-0">Your Account No. ${splitNumber(accountNo)}</p>
    <small>Account address: ${address}</small>
  </div>
  <div class="card-body">
    <div class="row">
      <div class="col">
        <div id="transaction-detail"></div>
      </div>
    </div>

    <div class="row justify-content-center mt-5">
      ${pinForm}
    </div>
    <div class="row justify-content-center">
      <div class="col col-md-5 mb-3">
        <button class="btn btn-primary px-4 btn-block" id="sign-tx" data-choice="ok"><i class="fas fa-sign-in-alt"></i> SIGN THIS</button>
      </div>
      <div class="col col-md-5">
        <button class="btn btn-danger px-4 btn-block" id="cancel-sign-tx" data-choice="cancel">CANCEL</button>
      </div>
    </div>
    </div>
  </div>`

  const pinInput = div.querySelector('#pin-input')
  const pinAlert = div.querySelector('#pin-alert')
  const transactionDetailDiv = div.querySelector('#transaction-detail')
  displayTransaction(document, transactionDetailDiv, tx)

  const promise = new Promise(resolve => {
    const verifyChoice = choice => {
      if (choice === 'ok') {
        const isValid = validatePin(pinInput, pinAlert)
        if (!isValid) return
      }

      resolve([choice, pinInput.value.trim()])
    }

    div
      .querySelectorAll('button')
      .forEach(b =>
        b.addEventListener('click', ev => verifyChoice(ev.currentTarget.dataset.choice))
      )
  })

  return [div, promise]
}
