'use strict'

const openpgpURL = './js/openpgp.worker.bundle.js'
const openpgpSRI = 'sha384-FOhMU3wjaE3eT5B6TIzi1LyTEdGWVmndJuxyQfMqEBpqYQYByN6C0dfHF2GM1k3c'

const scriptURL = './js/main.bundle.js'
const scriptSignatureURL = './js/main.bundle.js.sig.asc'

const pubkey = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: OpenPGP.js v3.1.0
Comment: https://openpgpjs.org

xjMEW872fhYJKwYBBAHaRw8BAQdA0KQaNJnE3I6/f0YzR1gM7KHNWPn9qkBJ
sa2kLaoC+MfNMUtleUh1YiBWYXVsdCBDb2Rlc2lnbiA8Y29kZXNpZ25AdmF1
bHQua2V5aHViLmFwcD7CdwQQFgoAKQUCW872fgYLCQcIAwIJEELkBf08jsLz
BBUICgIDFgIBAhkBAhsDAh4BAAB3zgEAqGsP8/vdLzvgmd6x1eFMRCa3JF55
thappUowQZWOvqwA/RGUE4QZbT8XlvjjcW+Xu68/UmpiqfgUdM2Nd9GmERoM
zjgEW872fhIKKwYBBAGXVQEFAQEHQLoFl0m0/4X9oyqFs06M51AJukIIW9KN
rHut5HrVUqtgAwEIB8JhBBgWCAATBQJbzvZ+CRBC5AX9PI7C8wIbDAAA2wIA
/i978c1Uj7dBarCXbzbnkrBKrQPFk8sKg/kRVPERJ7JOAQDfQjVfvC4yyoOA
1YDCzrGOfr93jkYcJuheUFj4HlLiAw==
=jewd
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

const progressInfoDiv = document.getElementById('progressInfo') // eslint-disable-line no-undef
progressInfoDiv.innerHTML = ''
const printLog = (msg, obj) => {
  /* eslint-disable no-console */
  if (obj) console.info(msg, obj)
  else console.info(msg)
  progressInfoDiv.innerHTML = msg
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
        printLog(`Verifying signature of main script using signature at ${detachedSigRes.url}`)
        // printLog(detachedSig)

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
                printLog(
                  'Warning: Remote Security Check Failed! Will use an older version instead...'
                )
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
    })
  })
  .then(() => {
    printLog('Starting...')
    document.getElementById('loader').style.display = 'none' // eslint-disable-line no-undef
  })
  .catch(error => {
    const errorMessage = `Fatal Error: ${error.message || error}. Please try again.`
    printLog(errorMessage)
    window.alert(errorMessage) // eslint-disable-line no-alert
    setTimeout(() => self.close(), 5000) // eslint-disable-line no-restricted-globals
  })
