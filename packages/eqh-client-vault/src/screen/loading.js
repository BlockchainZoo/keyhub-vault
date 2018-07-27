import { safeHtml } from 'common-tags'

export default function createElement(document, message) {
  const div = document.createElement('div')
  div.innerHTML = (safeHtml`
  <div class="card-header text-center bg-secondary text-white">
    <h4><i class="fas fa-broadcast-tower"></i> ${message}...</h4>
  </div>
  <div class="justify-content-center flex-row align-items-center h-30 d-flex p-2">
    <div class="lds-roller">
      <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
    </div>
  </div>`)
  return div
}