import { safeHtml } from 'common-tags'

import loadVault from './vault'

const vars = {
  mainDiv: 'main',
}

const htmlTemplate = (safeHtml`
<div class="free-background">&nbsp;</div>

<header>
    <nav class="navbar navbar-expand-lg navbar-dark">

      <a class="navbar-brand d-flex order-1" href="/">Keyhub</a>

      <!--
      <div class="d-flex d-md-flex d-lg-hide order-lg-3 order-2">
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
          aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
      </div>

      <div class="collapse navbar-collapse order-lg-2 order-3 justify-content-between" id="navbarSupportedContent">
        <div class="d-flex order-2">
          <ul class="navbar-nav flex-sm-row">
            <li class="nav-item text-md-center">
              <a class="nav-link active" href="#">Sign in</a>
            </li>
            <li class="nav-item text-md-center">
              <a class="btn btn-outline-light" href="#">Sign Up</a>
            </li>
          </ul>
        </div>


        <div class="d-flex order-1">
          <ul class="navbar-nav">
            <li class="nav-item active">
              <a class="nav-link" href="#" id="navbar-home-link">Home
                <span class="sr-only">(current)</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">Link</a>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true"
                aria-expanded="false">
                Dropdown
              </a>
              <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                <a class="dropdown-item" href="#">Action</a>
                <a class="dropdown-item" href="#">Another action</a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item" href="#">Something else here</a>
              </div>
            </li>
          </ul>
        </div>

      </div>
      -->

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
