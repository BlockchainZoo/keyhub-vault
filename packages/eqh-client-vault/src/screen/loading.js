import { safeHtml } from 'common-tags'

export default function createElement(document, platform) {
  const div = document.createElement('div')
  div.innerHTML = (safeHtml`<div class="justify-content-center flex-row align-items-center h-30 d-flex p-2">
  <h2>Generating passphrase for ${platform} ...</h2>
  <div class="lds-roller">
      <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
    </div>
  </div>`)
  return div
}