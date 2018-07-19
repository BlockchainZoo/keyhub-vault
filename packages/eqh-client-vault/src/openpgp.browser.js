/* eslint-disable no-undef */

const openpgpURL = '../dist/openpgp.worker.bundle.js'
const openpgpSRI = 'sha512-PgqZ9v+i8EL3pOm1E+jsEHXUmQ2g3mo9Y9nYJ9jC1zT22ZFYOiGARbMMkfQZyn1PIk4V4Bwrz/wj+p2f1u7f4Q=='

const scriptURL = '../dist/index.bundle.js'
const scriptSignatureURL = '../dist/index.bundle.js.sig.asc'

const pubkey = `
-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: OpenPGP.js v3.0.12
Comment: https://openpgpjs.org

xjMEW0o5uRYJKwYBBAHaRw8BAQdAKIwEv1UQw/mavaEAIuLmjvosaRLA0/pB
xP/HghzbzxHNEUVRSCA8ZXFoQGJjei5hcHA+wncEEBYKACkFAltKObkGCwkH
CAMCCRAeo89Z4d3PXwQVCAoCAxYCAQIZAQIbAwIeAQAAWr8BAOGwJVtL1+jT
tpK/saMgg6Ecde/ZLwMB+dgDcRLDvGHOAQCezn7c2WVSQ8Bs53z7XiGDX+DD
UCQ+jQigbXrsYXnHC844BFtKObkSCisGAQQBl1UBBQEBB0As2EpAZcJ/yg65
NS0PFrCq/obHQ9JfOcAEUbPRaUFXUgMBCAfCYQQYFggAEwUCW0o5uQkQHqPP
WeHdz18CGwwAAOKIAP9iPrFzkEMDdOOTbHD3i2NidKz7RYFMWr/RoE6h/gNc
cAD+J1TkOYDmMWjxvrJkHU/hTXvrC3jg2KSzGQhw0H4FXgQ=
=82xi
-----END PGP PUBLIC KEY BLOCK-----`


const openpgpScript = document.createElement('script')
openpgpScript.type = 'text/javascript'
openpgpScript.src = openpgpURL
openpgpScript.integrity = openpgpSRI
openpgpScript.crossOrigin = 'anonymous'
openpgpScript.async = false
document.head.appendChild(openpgpScript)

fetch(openpgpURL, {
  integrity: openpgpSRI,
})
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
      publicKeys: openpgp.key.readArmored(pubkey).keys, // for verification
    }

    return openpgp.verify(params).then((verified) => {
      const validity = verified.signatures[0].valid // true
      if (validity) {
        // eslint-disable-next-line no-console
        console.info(`Security Check Passed! Javascript at ${msgRes.url} signed by PGP key id ${verified.signatures[0].keyid.toHex()}`)

        const blob = new Blob([data], { type: msgRes.headers.get('content-type') })
        return URL.createObjectURL(blob)
      }
      throw new Error('Security Breach! Javascript has been tampered with!')
    })
  })
  .then((localUrl) => {
    if (window.Worker) {
      const myWorker = new Worker(localUrl)
      // eslint-disable-next-line no-console
      myWorker.onerror = error => console.warn(JSON.stringify(error))
    }
    return true
  })
