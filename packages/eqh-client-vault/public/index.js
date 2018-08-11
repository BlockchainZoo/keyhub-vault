'use strict'

const openpgpURL = './js/openpgp.worker.bundle.js'
const openpgpSRI = 'sha384-FOhMU3wjaE3eT5B6TIzi1LyTEdGWVmndJuxyQfMqEBpqYQYByN6C0dfHF2GM1k3c'

const scriptURL = './js/main.bundle.js'
const scriptSignatureURL = './js/main.bundle.js.sig.asc'

const pubkey = `-----BEGIN PGP PUBLIC KEY BLOCK-----
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
-----END PGP PUBLIC KEY BLOCK-----`

const pubkeyText = pubkey
  .split(/[\n\r]/g)
  .map(l => l.trim())
  .join('\n')

// This works on all devices/browsers, and uses IndexedDBShim as a final fallback
const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB

const documentBody = document.getElementById('body') // eslint-disable-line no-undef
documentBody.innerHTML = ''
const printLog = (msg, obj) => {
  /* eslint-disable no-console */
  documentBody.innerHTML += `<pre>${msg}</pre>`
  if (obj) console.info(msg, obj)
  else console.info(msg)
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

loadOpenpgp
  .catch(event => {
    const error = event.error || event.target.src
    const errorMessage = `Could not download OpenPGP library: ${error} . \nYour internet connection might be broken or faulty. Please try again later.`
    printLog(errorMessage)
    window.alert(errorMessage) // eslint-disable-line no-alert
    setTimeout(() => self.close(), 5000) // eslint-disable-line no-restricted-globals
  })
  .then(openpgp => {
    printLog('Loading OpenPGP webworker...')
    return fetch(openpgpURL, { integrity: openpgpSRI })
      .then(res => res.ok && res.blob())
      .then(blob => URL.createObjectURL(blob))
      .then(url => openpgp.initWorker({ path: url }))
      .then(() => {
        printLog(`Downloading main script at ${scriptURL} and its PGP signature...`)
        return Promise.all([
          fetch(scriptURL).then(res1 => res1.ok && res1.arrayBuffer().then(buf => [buf, res1])),
          fetch(scriptSignatureURL).then(
            res2 => res2.ok && res2.text().then(t => [t.trim(), res2])
          ),
        ])
      })
      .then(([[msgBuffer, msgRes], [detachedSig, detachedSigRes]]) => {
        printLog(`Verifying signature of main script using signature at ${detachedSigRes.url} :`)
        printLog(detachedSig)

        const contentType = msgRes.headers.get('content-type')

        const data = new Uint8Array(msgBuffer)
        const params = {
          message: openpgp.message.fromBinary(data), // input as Message object
          signature: openpgp.signature.readArmored(detachedSig), // parse detached signature
          publicKeys: openpgp.key.readArmored(pubkeyText).keys, // for verification
        }

        return openpgp.verify(params).then(({ signatures }) => {
          const { keyid, valid: isValid } = signatures[0]

          if (isValid) {
            const okMessage = `Security Check Passed! Main script signed by PGP key id ${keyid.toHex()}`
            printLog(okMessage)
          }

          const dbName = 'pgpdb'
          const storeName = 'codeSign'
          return new Promise((resolve, reject) => {
            const open = indexedDB.open(dbName, 1)
            open.onupgradeneeded = () => {
              open.result.createObjectStore(storeName, { keyPath: 'id' })
            }
            open.onerror = error => reject(error)
            open.onsuccess = () => {
              const db = open.result
              const tx = db.transaction([storeName], 'readwrite')
              tx.onerror = error => reject(error)
              tx.oncomplete = () => db.close()

              const store = tx.objectStore(storeName)
              const get = store.get('lastSeen')
              get.onsuccess = () => {
                if (!get.result) {
                  if (!isValid) {
                    const errorMessage =
                      'Security Breach! Javascript has been tampered with! Please contact KeyHub Support immediately.'
                    printLog(`<h3>${errorMessage}</h3>`)
                    throw new Error(errorMessage)
                  }

                  store.put({
                    id: 'lastSeen',
                    signature: detachedSig,
                    code: msgBuffer,
                    type: contentType,
                  })

                  const blob = new Blob([data], { type: contentType })
                  resolve(URL.createObjectURL(blob))
                  return
                }

                const { signature: lastSignature, code: lastCode, type: lastType } = get.result

                if (isValid) {
                  if (detachedSig === lastSignature) {
                    const blob = new Blob([data], { type: contentType })
                    resolve(URL.createObjectURL(blob))
                    return
                  }

                  // eslint-disable-next-line no-alert
                  const isYes = window.confirm(
                    'This app has a new software update. Would you like to download & install the new version?'
                  )
                  if (isYes) {
                    store.put({
                      id: 'lastSeen',
                      signature: detachedSig,
                      code: msgBuffer,
                      type: contentType,
                    })
                    const blob = new Blob([data], { type: contentType })
                    resolve(URL.createObjectURL(blob))
                    return
                  }
                }

                // Fallback to last seen code
                const lastData = new Uint8Array(lastCode)
                const lastParams = {
                  message: openpgp.message.fromBinary(lastData), // input as Message object
                  signature: openpgp.signature.readArmored(lastSignature), // parse detached signature
                  publicKeys: openpgp.key.readArmored(pubkeyText).keys, // for verification
                }

                openpgp
                  .verify(lastParams)
                  .then(({ signatures: sigs }) => {
                    const { keyid: lastKeyid, valid: isLastValid } = sigs[0]

                    if (!isLastValid) {
                      const errorMessage =
                        'Local Security Breach! Javascript has been tampered with! Please contact KeyHub Support immediately.'
                      printLog(`<h3>${errorMessage}</h3>`)
                      throw new Error(errorMessage)
                    }

                    printLog(
                      `Local Security Check Passed! Main script signed by PGP key id ${lastKeyid.toHex()}`
                    )

                    const blob = new Blob([lastData], { type: lastType })
                    resolve(URL.createObjectURL(blob))
                  })
                  .catch(error => reject(error))
              }
            }
          })
        })
      })
  })
  .then(localBlobURL => {
    printLog('Loading main script into the page...')
    return new Promise((resolve, reject) => {
      const payloadScript = document.createElement('script')
      payloadScript.type = 'text/javascript'
      payloadScript.src = localBlobURL
      payloadScript.crossOrigin = 'anonymous'
      payloadScript.async = true
      payloadScript.onload = resolve
      payloadScript.onerror = reject
      document.head.appendChild(payloadScript)
      printLog('Starting...')
    })
  })
  .catch(error => {
    const errorMessage = `Fatal Error: ${error.message || error}. Please try again.`
    printLog(errorMessage)
    window.alert(errorMessage) // eslint-disable-line no-alert
    setTimeout(() => self.close(), 5000) // eslint-disable-line no-restricted-globals
  })
