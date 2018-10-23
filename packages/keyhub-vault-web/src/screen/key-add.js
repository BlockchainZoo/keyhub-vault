import { safeHtml } from 'common-tags'

export default function createElement(document) {
  const div = document.createElement('div')
  div.innerHTML = safeHtml`
  <h2 class="page-title">Platforms & Merchants</h2>
  <p>
    Please pick from one of our partners below:
  </p>
  <div class="plaform-picker">
    <a href="#" data-platform="EQH">
      <img src="./img/brand/eqh-logo.png" alt="EquineHub" />
    </a>
  </div>
  `

  const promise = new Promise(resolve => {
    const options = div.querySelectorAll('a')
    options.forEach(a =>
      a.addEventListener('click', ev => resolve(ev.currentTarget.dataset.platform))
    )
  })

  return [div, promise]
}
