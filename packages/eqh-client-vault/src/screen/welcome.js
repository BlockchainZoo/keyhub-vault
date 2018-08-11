import { safeHtml } from 'common-tags'

export default function createElement(document, hasAccounts) {
  const div = document.createElement('div')
  div.innerHTML = safeHtml`
  <h2 class="page-title">Welcome</h2>
  <div class="entry-content">
    <p>Welcome to KeyHub, an open-source app for secure key storage!</p>
    <p>KeyHub is "Paypal for Blockchain"</p>
    <p>Using Paypal ensures that merchant websites you visit do not get permanent access to your sensitive credit-card data.</p>
    <p>Using KeyHub ensures that merchant websites you visit do not get permanent access to your private keys.</p>
    <p></p>
    <p>We at KeyHub take security seriously. Private Key material are generated locally inside your browser. Keys never leave your browser. Keys never reach the web.</p>
    <p>
      KeyHub has been audited by the
      <a href="https://observatory.mozilla.org/analyze/vault.keyhub.app" target="_blank"> Mozilla Foundation here.</a>
    </p>
    <p></p>
    <p>${
      hasAccounts
        ? 'Please select one of your accounts on the left sidebar to continue.'
        : 'Click "Add Key" on the left sidebar to begin.'
    }</p>
  </div>
  `
  return div
}
