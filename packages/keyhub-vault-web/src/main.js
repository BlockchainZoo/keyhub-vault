import { safeHtml } from 'common-tags'

import loadVault from './vault'

const mainDivId = 'main'

const htmlTemplate = safeHtml`
<div class="app">
  <div class="free-background">&nbsp;</div>

  <header>
    <nav class="navbar navbar-expand-lg navbar-dark justify-content-center">

      <a class="navbar-brand flex-grow-0 order-1" href="/">KeyHub</a>

    </nav>

  </header>

  <div id="${mainDivId}"></div>

  <footer>
    <div class="text-center">
      &copy; Blockchainzoo 2018
    </div>
  </footer>
</div>
`

const isLocalhost =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
document.title = isLocalhost ? 'Local Offline Vault' : 'KeyHub Web Vault'

const link = document.createElement('link')
link.type = 'text/css'
link.rel = 'stylesheet'
link.href = './css/main.css'
link.integrity = 'sha384-ddkIUvvTGZrXCWpVfAs39qFOfgVQdvnmgTFuhTwppIw7sowAUmYfryZLY2wUgV1q'
link.crossOrigin = 'anonymous'
document.head.appendChild(link)

document.getElementById('body').innerHTML = htmlTemplate

const mainElement = document.getElementById(mainDivId)
loadVault(window, document, mainElement)
