import { safeHtml } from 'common-tags'

import loadVault from './vault'

const window = window // eslint-disable-line
const document = document // eslint-disable-line

const mainDivId = 'main'

const htmlTemplate = safeHtml`
<div class="free-background">&nbsp;</div>

<header>
    <nav class="navbar navbar-expand-lg navbar-dark justify-content-center">

      <a class="navbar-brand flex-grow-0 order-1" href="/">Keyhub</a>

    </nav>

  </header>

  <div id="${mainDivId}"></div>

  <footer>
    <div class="text-center">
      &copy; Blockchainzoo 2018
    </div>
  </footer>
`

const isLocalhost =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
document.title = isLocalhost ? 'Keyhub Offline Vault' : 'Keyhub Web Vault'

const link = document.createElement('link')
link.type = 'text/css'
link.rel = 'stylesheet'
link.href = './css/main.css'
document.head.appendChild(link)

document.getElementById('body').innerHTML = htmlTemplate

const mainElement = document.getElementById(mainDivId)
loadVault(window, document, mainElement)
