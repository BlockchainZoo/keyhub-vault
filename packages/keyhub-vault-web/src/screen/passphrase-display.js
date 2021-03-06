import { safeHtml } from 'common-tags'

export default function createElement(document, network, passphrase) {
  const div = document.createElement('div')
  div.classList.add('generate-key-page')

  const wordcount = passphrase.match(/([\s]+)/g).length + 1

  div.innerHTML = safeHtml`<h2 class="page-title">Add ${network} Key</h2>
  <div class="form-group">
    <label for="text-passphrase">Your automatically generated secret passphrase is:</label><br>
    <textarea class="form-control" id="passphrase-input">${passphrase}</textarea>
  </div>
  <p>Please write down on paper or memorize these ${wordcount} words (their order and capitalization matters - always lowercase).</p>
  <p>This seed passphrase is needed in order to recover access to your Blockchain account on another computer. (Copy & paste has been disabled because of this.)</p>
  <div class="form-group">
    <div class="alert alert-danger">
      Attention: Don't ever disclose your passphrase. If you lose it, you lose access to your account!
    </div>
  </div>
  <div class="form-group">
    <button type="button" class="btn btn-secondary" data-choice="ok">Next</button>
    <button type="button" class="btn btn-primary" data-choice="cancel">Cancel</button>
  </div>`

  const passphraseInput = div.querySelector('#passphrase-input')
  passphraseInput.addEventListener('copy', event => event.preventDefault())
  // passphraseInput.addEventListener('cut', event => event.preventDefault())

  const promise = new Promise(resolve => {
    div.querySelectorAll('button').forEach(b =>
      b.addEventListener('click', ev => {
        const {
          dataset: { choice },
        } = ev.currentTarget
        resolve([choice, passphraseInput.value.trim()])
      })
    )
  })

  return [div, promise]
}
