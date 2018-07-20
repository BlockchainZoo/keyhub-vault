/* eslint-disable strict */

'use strict'

const openpgpURL = '../dist/openpgp.worker.bundle.js'
const openpgpSRI = 'sha512-PgqZ9v+i8EL3pOm1E+jsEHXUmQ2g3mo9Y9nYJ9jC1zT22ZFYOiGARbMMkfQZyn1PIk4V4Bwrz/wj+p2f1u7f4Q=='

const scriptURL = '../dist/index.bundle.js'
const scriptSignatureURL = '../dist/index.bundle.js.sig.asc'

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

const loadOpenpgp = new Promise((resolve, reject) => {
  /* eslint-disable no-undef */
  const openpgpScript = document.createElement('script')
  openpgpScript.type = 'text/javascript'
  openpgpScript.src = openpgpURL
  openpgpScript.integrity = openpgpSRI
  openpgpScript.crossOrigin = 'anonymous'
  openpgpScript.async = true
  openpgpScript.onload = () => resolve((window && window.openpgp) || global.openpgp)
  openpgpScript.onerror = reject
  document.head.appendChild(openpgpScript)
})

loadOpenpgp.then(openpgp => (
  fetch(openpgpURL, { integrity: openpgpSRI })
    .then(res => res.ok && res.blob()).then(blob => URL.createObjectURL(blob)).then(url => (
      openpgp.initWorker({ path: url })
    ))
    .then(() => Promise.all([
      fetch(scriptURL).then(res1 => res1.ok && res1.arrayBuffer().then(b => [b, res1])),
      fetch(scriptSignatureURL).then(res2 => res2.ok && res2.text().then(t => [t, res2])),
    ]))
    .then(([[msgBuffer, msgRes], [detachedSig]]) => {
      const data = new Uint8Array(msgBuffer)

      const params = {
        message: openpgp.message.fromBinary(data), // input as Message object
        signature: openpgp.signature.readArmored(detachedSig), // parse detached signature
        publicKeys: openpgp.key.readArmored(pubkey.split(/[\n\r]/g).map(l => l.trim()).join('\n')).keys, // for verification
      }

      return openpgp.verify(params).then((verified) => {
        const validity = verified.signatures[0].valid // true
        if (validity) {
          // eslint-disable-next-line no-console
          console.info(`Security Check Passed! Javascript at ${msgRes.url} signed by PGP key id ${verified.signatures[0].keyid.toHex()}`)

          const blob = new Blob([data], { type: msgRes.headers.get('content-type') })
          return URL.createObjectURL(blob)
        }

        throw new Error('Security Breach! Javascript has been tampered with! Please contact Keyhub Support immediately.')
      })
    })
    .then(localURL => new Promise((resolve, reject) => {
      // if (window.Worker) {
      //   const myWorker = new Worker(localURL)
      //   // eslint-disable-next-line no-console
      //   myWorker.onerror = error => console.warn(JSON.stringify(error))
      // }

      const payloadScript = document.createElement('script')
      payloadScript.src = localURL
      // payloadScript.crossOrigin = 'anonymous'
      payloadScript.async = true
      payloadScript.onload = resolve
      payloadScript.onerror = reject
      document.head.appendChild(payloadScript)
    }))
    .catch((error) => {
      window.alert(error.message || error) // eslint-disable-line no-alert
      self.close() // eslint-disable-line no-restricted-globals
    })
))
