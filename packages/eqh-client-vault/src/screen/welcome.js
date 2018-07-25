import { safeHtml } from 'common-tags'

export default function createElement(document, hasAccounts) {
  const div = document.createElement('div')
  div.innerHTML = (safeHtml`
  <h2 class="page-title">Welcome</h2>
  <div class="entry-content">
    <p>Welcome to KeyHub!</p>
    <p>Keyhub is "Paypal for Blockchain".</p>
    <p>Using Paypal ensures that merchant websites you visit do not get permanent access to your sensitive credit-card data.</p>
    <p>Using Keyhub ensures that merchant websites you visit do not get permanent access to your private key data.</p>
    <p></p>
    <p>${hasAccounts ? 'Please select one of your accounts on the left sidebar to continue.' : 'Click "Add Key" on the left sidebar to begin.'}</p>
  </div>
  `)
  return div
}
