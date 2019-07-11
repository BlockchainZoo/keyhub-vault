import { safeHtml } from 'common-tags'

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

// const splitNumber = accountNo => {
//   const str = accountNo.toString()
//   const result = [str[0]]

//   for (let x = 1; x < str.length; x += 1) {
//     if (x % 5 === 0) {
//       result.push('.', str[x])
//     } else {
//       result.push(str[x])
//     }
//   }
//   return result.join('')
// }

const elOrderDetail = (title, value) => {
  const drawHtml = `
  <div class="row">
    <div class="col-7 text-strong">
      ${title}
    </div>
    <div class="col-5">
      ${value}
    </div>
  </div>`
  return drawHtml
}

const displayTransaction = (document, detailDiv, { type, data = {} }) => {
  const domFragment = document.createDocumentFragment()
  // let txData = ''

  const divTxTypeRow = document.createElement('div')
  divTxTypeRow.classList.add('row', 'my-2', 'border-bottom', 'py-3')

  const divTxTypeLabel = document.createElement('div')
  divTxTypeLabel.classList.add('col-7', 'text-capitalize', 'text-strong')
  divTxTypeLabel.appendChild(document.createTextNode('Type'))

  // const divTxIcon = document.createElement('div')
  // divTxIcon.classList.add('bullet-icon')

  const divTxIconFa = document.createElement('i')
  divTxIconFa.classList.add('fas', 'fa-money-bill-alt', 'text-secondary', 'mr-2')
  // divTxIcon.appendChild(divTxIconFa)

  const divTxType = document.createElement('div')
  divTxType.classList.add('col-5', 'text-grey')

  divTxType.appendChild(divTxIconFa)
  divTxType.appendChild(document.createTextNode(type))

  divTxTypeRow.appendChild(divTxTypeLabel)
  divTxTypeRow.appendChild(divTxType)
  // domFragment.appendChild(divTxTypeRow)

  // Object.keys(data).forEach(key => {
  const divRow = document.createElement('div')

  divRow.innerHTML = elOrderDetail(safeHtml`Quantity:`, data.quantity)
  divRow.innerHTML += elOrderDetail(safeHtml`Price per Share:`, `$${data.price}`)
  divRow.innerHTML += elOrderDetail(safeHtml`Cost of shares:`, `$${data.price * data.quantity}`)
  divRow.innerHTML += elOrderDetail(safeHtml`TradingFee(1%):`, `$${data.tradingFee / 100}`)
  divRow.innerHTML += elOrderDetail(
    safeHtml`Current mth training fee<i class="fas fa-question-circle cursor-fee-info"><div class="fee-info">Training fees for current month is indicative and actual training fees shall be pro-rated to actual order execution date.</div></i>:`,
    `$${data.trainingFeeAmount}`
  )
  divRow.innerHTML += elOrderDetail(
    safeHtml`Maintenance Deposit:`,
    `$${data.maintenanceDepositAmount}`
  )
  divRow.innerHTML += safeHtml(`<div class="mt-2">&nbsp;</div>`)
  divRow.innerHTML += elOrderDetail(safeHtml`Total:`, `$${data.totalPurchase}`)
  // divRow.classList.add('row', 'my-1')

  // const divKey = document.createElement('div')
  // divKey.classList.add('col-7', 'text-capitalize', 'text-strong')

  // divKey.appendChild(document.createTextNode(key))

  // const divVal = document.createElement('div')
  // divVal.classList.add('col-5', 'text-grey')

  // txData = key === 'recipient' ? splitNumber(data[key]) : data[key]

  // divVal.appendChild(document.createTextNode(txData))

  // divRow.appendChild(divKey)
  // // divRow.appendChild(divColon)
  // divRow.appendChild(divVal)

  domFragment.appendChild(divRow)
  // })

  detailDiv.appendChild(domFragment)
}

export default function createElement(document, platform, accountNo, address, tx, promptPin) {
  const div = document.createElement('div')

  div.innerHTML = safeHtml`
  <div class="card-header text-center border-0 bg-white">
    <h4 class="mb-4">Sell - Order Confirmation</h4>
  </div><!-- .card-header -->

  <div class="card-body">

    <div class="row">

      <div class="col">
        <div id="transaction-detail"></div>
      </div>

    </div><!-- .row -->

    <div class="${promptPin ? '' : 'd-none '}row justify-content-center mt-5">

      <div class="form-group">
        <label for="text-pin">Security Pin: </label><br>
        <input type="password" class="form-control" id="pin-input" />
      </div><!-- .form-group -->

      <div id="pin-alert" class="d-none form-group"></div>

    </div><!-- .row.justify-content-center -->

    <div class="row">
      <div class="col-12 mb-5 mt-4">
        Please ensure the above order information is correct. By clicking <strong>CONFIRM</strong>, you agree to the Partnership Agreement.
      </div>
    </div>

    <div class="row justify-content-center">

      <div class="col col-md-5 mb-3">
        <button class="btn btn-primary px-4 btn-block" id="sign-tx" data-choice="ok">Confirm</button>
      </div>

      <div class="col col-md-5">
        <button class="btn btn-outline-grey px-4 btn-block" id="cancel-sign-tx" data-choice="cancel">Cancel</button>
      </div>

    </div><!-- .row.justify-content-center -->

  </div><!-- .card-body -->`

  const pinInput = div.querySelector('#pin-input')
  const pinAlert = div.querySelector('#pin-alert')
  const transactionDetailDiv = div.querySelector('#transaction-detail')
  displayTransaction(document, transactionDetailDiv, tx)

  const promise = new Promise(resolve => {
    const verifyChoice = choice => {
      if (choice === 'ok' && promptPin) {
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
