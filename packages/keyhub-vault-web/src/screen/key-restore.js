import { safeHtml } from 'common-tags'

const validatePassphrase = (address, passphraseInfo, passphraseInput, passphraseAlert) => {
  /* eslint-disable no-param-reassign */
  const passphraseInputTrim = passphraseInput.value.trim()
  if (passphraseInputTrim) {
    if (passphraseInfo.address === address) {
      passphraseInput.classList.remove('is-invalid')
      passphraseInput.classList.add('is-valid')
      passphraseAlert.classList.remove('d-block')
      passphraseAlert.classList.add('d-none')
      passphraseAlert.innerHTML = ''

      return true
    }

    passphraseInput.classList.add('is-invalid')
    passphraseAlert.innerHTML = `Invalid passphrase! This passphrase is for '${
      passphraseInfo.address
    }'. Please provide the right passphrase for '${address}.'`
    passphraseAlert.classList.add('invalid-feedback', 'd-block')
  } else {
    passphraseInput.classList.add('is-invalid')
    passphraseAlert.innerHTML = "Passphrase can't be empty!"
    passphraseAlert.classList.add('invalid-feedback', 'd-block')
  }

  return false
}

export default function createElement(
  document,
  title,
  message,
  platform,
  desiredAddress,
  getPassphraseInfoFunc
) {
  const div = document.createElement('div')
  div.classList.add('form-key-restore')

  div.innerHTML = safeHtml`
    <h2 class="page-title">${title}</h2>
    <p>${message}</p>
    <div class="form-group">
      <label for="phonenum-input">Passphrase</label><br>
      <textarea class="form-control" id="passphraseInput" placeholder="${platform.toLowerCase()} xxxxx xxxxx xxxxx"></textarea>
    </div>
    <div id="passphraseAlert" class="d-none form-group"></div>
    <div class="form-group row">
      <div class="col-8 offset-2 col-sm-4 offset-sm-4 mb-3 mt-4 col-button-ok">
        <button type="button" class="btn btn-primary btn-block " data-choice="ok">Restore</button>
      </div>
      <div class="col-8 offset-2 col-sm-4 offset-sm-4 mb-3 col-button-skip">
        <button type="button" class="btn btn-link text-primary" data-choice="cancel">Cancel</button>
      </div>
    </div>
  `

  const promise = new Promise(resolve => {
    const passphraseInput = div.querySelector('#passphraseInput')
    const passphraseAlert = div.querySelector('#passphraseAlert')

    const verifyChoice = choice => {
      if (choice === 'ok') {
        const passphraseVal = passphraseInput.value.trim()
        getPassphraseInfoFunc(passphraseVal).then(passphraseInfo => {
          const isValid = validatePassphrase(
            desiredAddress,
            passphraseInfo,
            passphraseInput,
            passphraseAlert
          )
          if (isValid) resolve([choice, passphraseVal])
        })
      } else {
        resolve([choice])
      }
    }

    div
      .querySelectorAll('button')
      .forEach(b =>
        b.addEventListener('click', ev => verifyChoice(ev.currentTarget.dataset.choice))
      )

    // passphraseInput.addEventListener('paste', event => event.preventDefault())
  })

  return [div, promise]
}
