import { safeHtml, html } from 'common-tags'

const validatePassphrase = (passphrase, passphraseInput, passphraseAlert) => {
  /* eslint-disable no-param-reassign */
  const passphraseInputTrim = passphraseInput.value.trim()
  if (passphraseInputTrim) {
    if (passphraseInputTrim === passphrase) {
      passphraseInput.classList.remove('is-invalid')
      passphraseInput.classList.add('is-valid')
      passphraseAlert.classList.remove('d-block')
      passphraseAlert.classList.add('d-hide')
      passphraseAlert.innerHTML = ''

      return true
    }

    passphraseInput.classList.add('is-invalid')
    passphraseAlert.innerHTML =
      'Invalid passphrase! Please check your input or generate a new passphrase...'
    passphraseAlert.classList.add('invalid-feedback', 'd-block')
  } else {
    passphraseInput.classList.add('is-invalid')
    passphraseAlert.innerHTML = "Passphrase can't be empty!"
    passphraseAlert.classList.add('invalid-feedback', 'd-block')
  }

  return false
}

const validatePin = (pinInput, pinConfirmInput, pinAlert) => {
  /* eslint-disable no-param-reassign */
  const pinInputTrim = pinInput.value.trim()
  const pinInputConfirmTrim = pinConfirmInput.value.trim()
  if (pinInputTrim) {
    if (pinInputTrim === pinInputConfirmTrim) {
      pinConfirmInput.classList.remove('is-invalid')
      pinConfirmInput.classList.add('is-valid')
      pinAlert.classList.remove('d-block')
      pinAlert.classList.add('d-hide')
      pinAlert.innerHTML = ''

      return true
    }

    pinConfirmInput.classList.add('is-invalid')
    pinAlert.innerHTML = 'PIN does not match! Please check your input...'
    pinAlert.classList.add('invalid-feedback', 'd-block')
  } else {
    pinInput.classList.add('is-invalid')
    pinAlert.innerHTML = "PIN can't be empty!"
    pinAlert.classList.add('invalid-feedback', 'd-block')
  }

  return false
}

export default function createElement(document, passphrase, withPin, callback) {
  const div = document.createElement('div')

  const pinForm = safeHtml`
    <div class="form-group">
      <label for="text-pin">Please input a new Security PIN: (any letter or number)</label><br>
      <input type="password" class="form-control" id="pin-input" />
    </div>
    <div class="form-group">
      <label for="text-pin-confirm">Please re-confirm your Security PIN:</label><br>
      <input type="password" class="form-control" id="pin-confirm-input" />
    </div>
    <div id="pin-alert" class="d-hide form-group"></div>
  `

  div.innerHTML = html`
    <h2 class="page-title">Confirm Backup of Passhphrase</h2>
    <div class="form-group">
      <label for="text-passphrase-copied">Your passphrase is very important! In order to be sure that you have written it to paper, please type your passphrase below:</label><br>
      <textarea class="form-control" id="passphrase-input"></textarea>
    </div>
    <div id="passphrase-alert" class="d-hide form-group"></div>
    ${withPin ? pinForm : ''}
    <div class="form-group">
      <button type="button" class="btn btn-secondary" data-choice="ok">Finish</button>
      <button type="button" class="btn btn-primary" data-choice="cancel">Cancel</button>
    </div>
  `

  const passphraseInput = div.querySelector('#passphrase-input')
  const passphraseAlert = div.querySelector('#passphrase-alert')
  const pinInput = div.querySelector('#pin-input')
  const pinConfirmInput = div.querySelector('#pin-confirm-input')
  const pinAlert = div.querySelector('#pin-alert')

  // passphraseInput.addEventListener('paste', event => event.preventDefault())

  const verifyChoice = choice => {
    if (choice === 'ok') {
      const isValid =
        validatePassphrase(passphrase, passphraseInput, passphraseAlert) &&
        (withPin ? validatePin(pinInput, pinConfirmInput, pinAlert) : true)
      if (!isValid) return
    }

    callback(null, [choice, pinInput.value.trim()])
  }

  if (callback) {
    div
      .querySelectorAll('button')
      .forEach(b =>
        b.addEventListener('click', ev => verifyChoice(ev.currentTarget.dataset.choice))
      )
  }

  return div
}
