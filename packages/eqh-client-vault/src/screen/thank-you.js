import { safeHtml } from 'common-tags'

export default function createElement(document, message, callback) {
  const div = document.createElement('div')
  div.innerHTML = (safeHtml`<div class="card">
  <div class="card-header text-center bg-success text-white">
      <h4><i class="fas fa-check-square"></i> Thank You!</h4>
  </div>
  <div class="card-body">
      <p>${message}</p>
      <div class="text-center">
        <button class="btn btn-primary" id="back-to-app" data-choice="ok"><i class="fas fa-mobile-alt"></i> Back to App</button>
      </div>
  </div>`)

  if (callback) {
    div.querySelectorAll('button').forEach(b => (
      b.addEventListener('click', (ev) => {
        const { dataset: { choice } } = ev.currentTarget
        callback(null, choice)
      })
    ))
  }

  return div
}
