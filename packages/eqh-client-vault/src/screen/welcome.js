import { safeHtml } from 'common-tags'

export default function createElement(document) {
  const div = document.createElement('div')
  div.innerHTML = (safeHtml`
  <h2 class="page-title">Welcome</h2>
  <div class="entry-content">
    <p>
      Welcome to KeyHub!
      Keyhub is "Paypal for Blockchain". Just as using Paypal ensures merchants do not hold unto sensitive credit-card data, using Keyhub ensures merchants do not have access to your private keys.
      Click "Add Account" on the left sidebar to begin. / Please select one of your accounts on the left sidebar to continue.
    </p>
  </div>
  `)
  return div
}
