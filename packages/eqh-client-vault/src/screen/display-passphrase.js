import { safeHtml } from 'common-tags'

export default function createElement(document, passphrase, callback) {
  const div = document.createElement('div')
  div.innerHTML = (safeHtml`<h2 class="page-title">EQH Generate Passhphrase</h2>
  <div class="form-group">
    <label for="text-passphrase">Your automatically generated passphrase is:</label><br>
    <textarea class="form-control" id="passphrase-input">${passphrase}</textarea>
  </div>
  <p>Please write down or memorize these 12 words (their order and capitalization matters - always lowercase). This passphrase is needed in order to access your account.</p>
  <div class="form-group">
    <div class="alert alert-danger">
      Attention: Don't ever disclose your passphrase. If you lose it you lose access to your blockchain account!
    </div>
  </div>
  <div class="form-group">
    <button type="button" class="btn btn-secondary" data-choice="ok">Next</button>
    <button type="button" class="btn btn-primary" data-choice="cancel">Cancel</button>
  </div>`)

  if (callback) {
    const passphraseInput = div.querySelector('#passphrase-input')
    div.querySelectorAll('button').forEach(b => (
      b.addEventListener('click', (ev) => {
        const { dataset: { choice } } = ev.currentTarget
        callback(null, [choice, passphraseInput.value.trim()])
      })
    ))
  }

  return div
}
