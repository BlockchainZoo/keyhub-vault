import { safeHtml } from 'common-tags'

import loadVault from './vault'

const vars = {
  mainDiv: 'main',
}

const htmlTemplate = (safeHtml`
<div class="free-background">&nbsp;</div>

<header>
    <nav class="navbar navbar-expand-lg navbar-dark justify-content-center">

      <a class="navbar-brand flex-grow-0 order-1" href="/">Keyhub</a>

    </nav>

  </header>

  <div id="${vars.mainDiv}"></div>

  <footer>
    <div class="text-center">
      &copy; Blockchainzoo 2018
    </div>
  </footer>
`)

// eslint-disable-next-line no-undef
document.title = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'Keyhub Offline Vault'
  : 'Keyhub Web Vault'

// eslint-disable-next-line no-undef
const link = document.createElement('link')
link.type = 'text/css'
link.rel = 'stylesheet'
link.href = './css/main.css'
// eslint-disable-next-line no-undef
document.head.appendChild(link)

// eslint-disable-next-line no-undef
document.getElementById('body').innerHTML = htmlTemplate

// eslint-disable-next-line no-undef
const mainElement = document.getElementById(vars.mainDiv)
// eslint-disable-next-line no-undef
loadVault(window, document, mainElement)
