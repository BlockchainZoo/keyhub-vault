import { safeHtml } from 'common-tags'

export default function createElement(document, keyDetail) {
  const { accountNo, address, publicKey, passphraseImage = {} } = keyDetail
  const splitAccNo = `${accountNo.substring(0, 5)}.${accountNo.substring(
    5,
    10
  )}.${accountNo.substring(10, 15)}.${accountNo.substring(15, accountNo.length)}`

  const div = document.createElement('div')
  div.classList.add('row', 'key-detail')
  div.innerHTML = safeHtml`
  <div class="col-12 px-5">
    <h2 class="page-title">Your Account Detail</h2>
    <div class="row my-2 border-bottom py-3">
        <div class="col-sm-4 text-capitalize text-strong text-field-head">
          Passphrase
        </div>
        <div class="col-sm-8 text-grey word-wrap text-field-data">
          ${passphraseImage.data ? '' : 'The seed passphrase is no longer available'}
          <canvas id="passphraseCanvas" width="${passphraseImage.width ||
            0}" height="${passphraseImage.height || 0}"></canvas>
        </div>
    </div>
    <div class="row">
      <div class="col-4 offset-4">
        <a href="#" class="btn btn-link text-success" id="clickShowMore">Show More</a>
      </div>
    </div>
    <div class="d-none" id="showMore">
      <div class="row my-2 border-bottom py-3" >
          <div class="col-sm-4 text-capitalize text-strong text-field-head">
            Account Number
          </div>
          <div class="col-sm-8 text-grey">
            ${splitAccNo}
          </div>
      </div>
      <div class="row my-2 border-bottom py-3">
          <div class="col-sm-4 text-capitalize text-strong text-field-head">
            Account Address
          </div>
          <div class="col-sm-8 text-grey text-field-data">
            ${address}
          </div>
      </div>
      <div class="row my-2 border-bottom py-3">
          <div class="col-sm-4 text-capitalize text-strong text-field-head">
            Public Key
          </div>
          <div class="col-sm-8 text-grey word-wrap text-field-data">
            ${publicKey}
          </div>
      </div>
    </div>
  </div>
  <div class="col-4 offset-4 mt-4">
    <!-- <button class="btn btn-danger btn-delete px-4 btn-delet-data" id="delete-this-key"><i class="fas fa-ban"></i> Delete</button> -->
    <button class="btn btn-success btn-block btn-ok px-2 px-sm-4" data-choice="ok">OK</button>
  </div>
  `

  const showMore = div.querySelector('#showMore')
  const clickShowMore = div.querySelector('#clickShowMore')
  const passphraseCanvas = div.querySelector('#passphraseCanvas')

  // Add click event listener
  clickShowMore.addEventListener('click', () => {
    showMore.classList.remove('d-none')
    clickShowMore.classList.toggle('d-none')
  })

  // Render the passphrase to the transparent canvas
  if (passphraseImage.data) {
    const ctx = passphraseCanvas.getContext('2d')
    const imageData = ctx.createImageData(passphraseImage.width, passphraseImage.height)
    imageData.data.set(passphraseImage.data)
    ctx.putImageData(imageData, 0, 0)
  }

  // Return a promise that resolves on user action
  const promise = new Promise(resolve => {
    div
      .querySelectorAll('button')
      .forEach(b => b.addEventListener('click', ev => resolve(ev.currentTarget.dataset.choice)))
  })

  return [div, promise]
}
