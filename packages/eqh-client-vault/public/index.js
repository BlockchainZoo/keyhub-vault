'use strict'

const openpgpURL = './js/openpgp.worker.bundle.js'
const openpgpSRI = 'sha512-z3XKhRza4Rjp0AFLiYK6c4laL5jTzB22LbM+QWTkr21j53MsiHS33GlzuzaVxnExWhGSZdYcAFGjaPaVbcAASA=='

const scriptURL = './js/main.bundle.js'
const scriptSignatureURL = './js/main.bundle.js.sig.asc'

const pubkey = (`
-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: OpenPGP.js v3.0.12
Comment: https://openpgpjs.org

xjMEW1GeVRYJKwYBBAHaRw8BAQdAQv33J/0En2GVY2ug5Chtt3Gy/l7x+YDS
lHmagHN2iqHNEUVRSCA8ZXFoQGJjei5hcHA+wncEEBYKACkFAltRnlUGCwkH
CAMCCRBkr/3Wn8VKaQQVCAoCAxYCAQIZAQIbAwIeAQAASV4BAIiKu2nBrUxn
b9jGhNNTjup0wCcBCAGNqnAokEVk6Kl6AP4gSLRfYTxh7BH+nsqeVT3lwyyQ
n520BbEaXGQ0FFJBCM44BFtRnlUSCisGAQQBl1UBBQEBB0Bwbx8jPQbTMayu
W01ssxLS3VyiYiJW16m9c7ubg4p+HwMBCAfCYQQYFggAEwUCW1GeVQkQZK/9
1p/FSmkCGwwAAH0cAQCQdWgExzXATzF/LCwqb54NLKPL2vrFQY0V/ryyi6mP
fQEA/HmvD8QGC18EuOAmk3UXaWyZMnFT3Fs08dcjqKr3uAg=
=NzpF
-----END PGP PUBLIC KEY BLOCK-----`)


const documentBody = document.getElementById('body') // eslint-disable-line no-undef
documentBody.innerHTML = ''
const printLog = (msg) => {
  documentBody.innerHTML += `<div>${msg}</div>`
  console.info(msg) // eslint-disable-line no-console
}

printLog('Loading OpenPGP library...')
const loadOpenpgp = new Promise((resolve, reject) => {
  /* eslint-disable no-undef */
  const openpgpScript = document.createElement('script')
  openpgpScript.type = 'text/javascript'
  openpgpScript.src = openpgpURL
  openpgpScript.integrity = openpgpSRI
  openpgpScript.crossOrigin = 'anonymous'
  openpgpScript.async = true
  openpgpScript.onload = () => resolve((window && window.openpgp) || global.openpgp)
  openpgpScript.onerror = event => reject(event)
  document.body.appendChild(openpgpScript)
})

loadOpenpgp.then((openpgp) => {
  printLog('Loading OpenPGP webworker...')
  fetch(openpgpURL, { integrity: openpgpSRI })
    .then(res => res.ok && res.blob()).then(blob => URL.createObjectURL(blob)).then(url => (
      openpgp.initWorker({ path: url })
    ))
    .then(() => {
      printLog('Downloading main script and PGP signature...')
      return Promise.all([
        fetch(scriptURL).then(res1 => res1.ok && res1.arrayBuffer().then(b => [b, res1])),
        fetch(scriptSignatureURL).then(res2 => res2.ok && res2.text().then(t => [t, res2])),
      ])
    })
    .then(([[msgBuffer, msgRes], [detachedSig, detachedSigRes]]) => {
      printLog(`Verifying signature of main script at ${msgRes.url} using signature at ${detachedSigRes.url} ...`)

      const data = new Uint8Array(msgBuffer)
      const params = {
        message: openpgp.message.fromBinary(data), // input as Message object
        signature: openpgp.signature.readArmored(detachedSig), // parse detached signature
        publicKeys: openpgp.key.readArmored(pubkey.split(/[\n\r]/g).map(l => l.trim()).join('\n')).keys, // for verification
      }

      return openpgp.verify(params).then((verified) => {
        const validity = verified.signatures[0].valid // true
        if (validity) {
          const okMessage = `Security Check Passed! Main script signed by PGP key id ${verified.signatures[0].keyid.toHex()}`
          printLog(okMessage)

          const blob = new Blob([data], { type: msgRes.headers.get('content-type') })
          return URL.createObjectURL(blob)
        }

        const errorMessage = 'Security Breach! Javascript has been tampered with! Please contact Keyhub Support immediately.'
        printLog(`<h3>${errorMessage}</h3>`)
        throw new Error(errorMessage)
      })
    })
    .then(localBlobURL => new Promise((resolve, reject) => {
      printLog('Adding main script to the page...')
      const payloadScript = document.createElement('script')
      payloadScript.type = 'text/javascript'
      payloadScript.src = localBlobURL
      payloadScript.crossOrigin = 'anonymous'
      payloadScript.async = true
      payloadScript.onload = resolve
      payloadScript.onerror = reject
      document.head.appendChild(payloadScript)
      printLog('Starting up...')
    }))
    .catch((error) => {
      const errorMessage = `Could not start due to Fatal Error: ${error.message || error}`
      printLog(errorMessage)
      window.alert(errorMessage) // eslint-disable-line no-alert
      self.close() // eslint-disable-line no-restricted-globals
    })
}).catch((event) => {
  const errorMessage = `Could not load OpenPGP library: ${event.error || event.target.src} . \nYour connection might be broken or insecure. Please try again.`
  printLog(errorMessage)
  window.alert(errorMessage) // eslint-disable-line no-alert
  self.close() // eslint-disable-line no-restricted-globals
})
