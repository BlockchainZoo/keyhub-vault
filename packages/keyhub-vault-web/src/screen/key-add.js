import { safeHtml } from 'common-tags'

export default function createElement(document) {
  const div = document.createElement('div')
  div.innerHTML = safeHtml`
  <h2 class="page-title">Platforms & Merchants</h2>
  <p>
    Please pick from one of the blockchain networks below:
  </p>
  <div class="plaform-picker">
    <a href="#" data-platform="EQH" data-network="Equinehub">
      <img src="./img/brand/equinehub-logo.png" alt="EquineHub Main Net" />
    </a>
    <a href="#" data-platform="EQH" data-network="Equinehub-Dev">
      <img src="./img/brand/equinehub-dev-logo.png" alt="EquineHub Dev Net" />
    </a>
  </div>
  `

  const promise = new Promise(resolve => {
    const options = div.querySelectorAll('a')
    options.forEach(a =>
      a.addEventListener('click', ev => resolve(Object.assign({}, ev.currentTarget.dataset)))
    )
  })

  return [div, promise]
}
