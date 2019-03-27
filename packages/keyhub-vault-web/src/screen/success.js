import { safeHtml } from 'common-tags'

export default function createElement(document, title, message, timeoutDuration) {
  const div = document.createElement('div')

  div.innerHTML = safeHtml`<div class="card card-tx-succsess">
    <div class="card-header text-center bg-success text-white">
        <h4><i class="fas fa-check-square"></i> ${title}</h4>
    </div>
    <div class="card-body">
        <p>${message}</p>
        <div class="text-center">
          <button class="btn btn-primary" id="back-to-app" data-choice="ok"><i class="fas fa-mobile-alt"></i> Back to App</button>
        </div>
    </div>
  </div>`

  const promise1 = new Promise(resolve => {
    div.querySelectorAll('button').forEach(b =>
      b.addEventListener('click', ev => {
        const {
          dataset: { choice },
        } = ev.currentTarget
        resolve(choice)
      })
    )
  })

  // Close the window after 5 seconds if no response from user
  const promise = !timeoutDuration
    ? promise1
    : Promise.race([
        promise1,
        new Promise(resolve => {
          setTimeout(() => resolve('timeout'), timeoutDuration)
        }),
      ])

  return [div, promise]
}
