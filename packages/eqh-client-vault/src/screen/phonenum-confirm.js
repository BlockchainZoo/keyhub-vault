import { safeHtml } from 'common-tags'

const validatePhoneNumber = (phoneNumInput, phoneNumAlert) => {
  /* eslint-disable no-param-reassign */
  const phoneNumberInputTrim = phoneNumInput.value.trim()
  if (phoneNumberInputTrim) {
    if (phoneNumberInputTrim.match(/(\+)[\d\s-]{6,}/)) {
      phoneNumInput.classList.remove('is-invalid')
      phoneNumInput.classList.add('is-valid')
      phoneNumAlert.classList.remove('d-block')
      phoneNumAlert.classList.add('d-none')
      phoneNumAlert.innerHTML = ''

      return true
    }

    phoneNumInput.classList.add('is-invalid')
    phoneNumAlert.innerHTML = 'Invalid phone number! Please provide dial code, eg: +65 12345678'
    phoneNumAlert.classList.add('invalid-feedback', 'd-block')
  } else {
    phoneNumInput.classList.add('is-invalid')
    phoneNumAlert.innerHTML = "Phone number can't be empty!"
    phoneNumAlert.classList.add('invalid-feedback', 'd-block')
  }

  return false
}

export default function createElement(document, phoneNumber, message) {
  const div = document.createElement('div')
  div.classList.add('form-confirm-phone-number')

  div.innerHTML = safeHtml`
    <h2 class="page-title">Confirm Phone Number</h2>
    <p>${message}</p>
    <div class="form-group">
      <label for="phonenum-input">Mobile Phone No.</label><br>
      <input type="tel" class="form-control text-phone-number" id="phonenumInput" value="${phoneNumber ||
        ''}" placeholder="+65 xxxxx" required />
    </div>
    <div id="phonenumAlert" class="d-none form-group"></div>
    <div class="form-group row">
      <div class="col-8 offset-2 col-sm-4 offset-sm-4 mb-3 mt-4 col-button-ok">
        <button type="button" class="btn btn-primary btn-block " data-choice="ok">Confirm</button>
      </div>
      <div class="col-8 offset-2 col-sm-4 offset-sm-4 mb-3 col-button-skip">
        <button type="button" class="btn btn-link text-primary" data-choice="skip">Skip</button>
      </div>
    </div>
  `

  const phoneNumInput = div.querySelector('#phonenumInput')
  const phoneNumAlert = div.querySelector('#phonenumAlert')

  // phoneNumInput.addEventListener('paste', event => event.preventDefault())

  const promise = new Promise(resolve => {
    const verifyChoice = choice => {
      if (choice === 'ok') {
        const isValid = validatePhoneNumber(phoneNumInput, phoneNumAlert)
        if (!isValid) return
      }

      resolve([choice, phoneNumInput.value.trim()])
    }

    div
      .querySelectorAll('button')
      .forEach(b =>
        b.addEventListener('click', ev => verifyChoice(ev.currentTarget.dataset.choice))
      )
  })

  return [div, promise]
}
