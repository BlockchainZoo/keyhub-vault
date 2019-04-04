'use strict'

const BYPASS_CODESIGN_VERIFY = true

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
const printLog = (msg, obj) => {
  // eslint-disable-next-line no-console
  if (obj) console.info(msg, '\n', obj)
  else console.info(msg) // eslint-disable-line no-console
  progressInfoDiv.textContent = msg
}

const freezeProto = function deepFreezeProto(obj) {
  if (!obj) return
  try {
    const proto = Object.getPrototypeOf(obj)
    if (!proto) return
    try {
      Object.freeze(proto)
    } catch (e) {
      // eslint-disable-next-line no-console
      if (!(e instanceof TypeError)) console.warn('Cannot freeze prototype', e, proto)
    } finally {
      deepFreezeProto(proto)
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Cannot get prototype', err, obj)
  }
}

const freezeProps = function deepFreezeProps(obj) {
  // Attribution: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze

  // Make properties not writable
  const props = Object.getOwnPropertyDescriptors(obj)
  const propNames = Object.keys(props)
  const updateProps = propNames.reduce((acc, key) => {
    const def = props[key]
    if (def.configurable && Number.isNaN(+key)) {
      acc[key] =
        'get' in def
          ? { set: undefined, configurable: false }
          : { writable: false, configurable: false }
    }
    return acc
  }, {})
  Object.defineProperties(obj, updateProps)

  // Make values of properties frozen (exclude props with getter)
  propNames
    .filter(key => !('get' in props[key]))
    .forEach(name => {
      try {
        const value = obj[name]
        if (!Object.isFrozen(value) && value !== window) {
          try {
            freezeProto(value)
            Object.freeze(value)
          } catch (e) {
            // eslint-disable-next-line no-console
            if (!(e instanceof TypeError)) console.warn('Cannot freeze value', e, name, value)
          } finally {
            deepFreezeProps(value)
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('forEach loop', err, name)
      }
    })
}

// Note: Cannot freeze window / global namespace here as,
// OpenPGP.js has some built-in polyfills for Promises
// TODO: Remove ugly polyfills from OpenPGP.js
// freezeProps(window || global)

printLog('Loading OpenPGP library...')
const loadOpenpgp = new Promise((resolve, reject) => {
  /* eslint-disable no-undef */
  const openpgpScript = document.createElement('script')
  openpgpScript.type = 'text/javascript'
  openpgpScript.src = openpgpURL
  openpgpScript.integrity = openpgpSRI
  openpgpScript.crossOrigin = 'anonymous'
  openpgpScript.async = false
  openpgpScript.onload = () => {
    printLog('Freezing objects in global namespace...')
    try {
      freezeProps(window || global)
      printLog('Frozen objects in global namespace')
    } catch (err) {
      printLog('Cannot freeze global namespace', err)
    }
    resolve((window && window.openpgp) || global.openpgp)
  }
  openpgpScript.onerror = event => reject(event.error || event.target.src)
  const firstScript = document.getElementsByTagName('script')[0]
  if (firstScript) firstScript.parentNode.insertBefore(openpgpScript, firstScript)
  else document.head.appendChild(openpgpScript)
})

loadOpenpgp
  .catch(error => {
    const errorMessage = `Could not download OpenPGP library. \nYour internet connection might be broken or faulty. Please try again later.`
    printLog(errorMessage, error)
    // window.alert(errorMessage) // eslint-disable-line no-alert
    // setTimeout(() => self.close(), 5000) // eslint-disable-line no-restricted-globals
  })
  .then(openpgp => {
    printLog('Loading OpenPGP webworker...')
    return fetch(openpgpURL, { integrity: openpgpSRI })
      .then(res => {
        if (res.ok) return res.blob()
        throw new Error(`Could not fetch OpenPGP worker with response status: ${res.status}`)
      })
      .then(blob => URL.createObjectURL(blob))
      .then(url => openpgp.initWorker({ path: url }))
      .then(() => {
        printLog(`Downloading main script at ${scriptURL} and its PGP signature...`)
        return Promise.all([
          fetch(scriptURL).then(scriptRes => {
            if (scriptRes.ok) return scriptRes.arrayBuffer().then(buf => [buf, scriptRes])
            throw new Error(`Could not fetch main script with response status: ${scriptRes.status}`)
          }),
          fetch(scriptSignatureURL).then(sigRes => {
            if (sigRes.ok || BYPASS_CODESIGN_VERIFY)
              return sigRes.text().then(t => [t.trim(), sigRes])
            throw new Error(
              `Could not fetch signature of main script with response status: ${sigRes.status}`
            )
          }),
        ])
      })
      .then(([[scriptBuffer, scriptRes], [detachedSigText, detachedSigRes]]) => {
        const scriptContentType = scriptRes.headers.get('content-type')

        if (BYPASS_CODESIGN_VERIFY && detachedSigRes.status === 404) {
          // BYPASS CODESIGNING for devs
          const warningMessage =
            'WARNING: Bypassing Verification of code-signature due to developer flag'
          printLog(warningMessage)
          window.alert(warningMessage) // eslint-disable-line no-alert

          // return objectUrl of main script
          const blob = new Blob([scriptBuffer], { type: scriptContentType })
          return URL.createObjectURL(blob)
        }

        printLog(
          `Verifying signature of main script using signature at ${detachedSigRes.url}`,
          detachedSigText
        )

        const verifyParams = {
          message: openpgp.message.fromBinary(new Uint8Array(scriptBuffer)), // input as Message object
          signature: openpgp.signature.readArmored(detachedSigText), // parse detached signature
          publicKeys: openpgp.key.readArmored(pubkeyText).keys, // for verification
        }

        return openpgp.verify(verifyParams).then(({ signatures }) => {
          const { keyid, valid: isSignatureValid, signature } = signatures[0]
          const { created: signatureDate } = signature.packets[0]
          // const { created: signatureDate } = signature.packets.findPacket(2)

          if (isSignatureValid) {
            printLog(
              `Security Check Passed! Main script signed by PGP key id ${keyid.toHex()}`,
              signatures[0]
            )
          }

          const dbName = 'pgpdb'
          const storeName = 'codeSign'
          const promise = new Promise((resolve, reject) => {
            if (!indexedDB) throw new Error('IndexedDB API unavailable')
            const open = indexedDB.open(dbName, 1)
            open.onupgradeneeded = () => {
              open.result.createObjectStore(storeName, { keyPath: 'id' })
            }
            open.onerror = ({ target }) => reject(target.error)
            open.onsuccess = () => {
              const db = open.result
              const tx = db.transaction([storeName], 'readwrite')
              tx.onerror = ({ target }) => reject(target.error)
              tx.oncomplete = () => db.close()

              const store = tx.objectStore(storeName)
              const get = store.get('lastSeen')
              get.onerror = ({ target }) => reject(target.error)
              get.onsuccess = ({ target: { result: entry } }) => {
                let lastSeen = entry
                if (lastSeen && !(lastSeen.code && lastSeen.signature && lastSeen.type)) {
                  // If lastSeen entry is corrupted
                  // Then, clear lastSeen version
                  store.delete('lastSeen')
                  lastSeen = null
                }

                if (!lastSeen && isSignatureValid) {
                  // If no old version, but received code-signature is valid
                  // Then, store valid code as lastSeen version
                  store.put({
                    id: 'lastSeen',
                    signature: detachedSigText,
                    code: scriptBuffer,
                    type: scriptContentType,
                  })
                  resolve({ ok: true })
                } else if (lastSeen && isSignatureValid) {
                  if (detachedSigText === lastSeen.signature) {
                    // If have old version, and received code-signature is valid and same
                    resolve({ ok: true })
                    return
                  }

                  // Check date of received signature is newer than last signature to prevent downgrade-attacks
                  const lastSeenSignature = openpgp.signature.readArmored(lastSeen.signature)
                  const { created: lastSeenSignatureDate } = lastSeenSignature.packets[0]
                  // const { created: lastSeenSignatureDate } = lastSeenSignature.packets.findPacket(2)

                  if (signatureDate >= lastSeenSignatureDate) {
                    // If have old version, and received code-signature is newer and valid
                    // Then, ask user to upgrade
                    // eslint-disable-next-line no-alert
                    const isYes = window.confirm(
                      'New software update available. Would you like to install the new version of Vault?'
                    )
                    if (isYes) {
                      // If user chooses Yes
                      // Then, store valid code as lastSeen version
                      store.put({
                        id: 'lastSeen',
                        signature: detachedSigText,
                        code: scriptBuffer,
                        type: scriptContentType,
                      })
                      resolve({ ok: true })
                    } else {
                      // If user chooses No
                      // Then, return the lastSeen version
                      printLog('Warning: User choose to use an older version.', lastSeen)
                      resolve({ ok: false, fallback: lastSeen })
                    }
                  } else {
                    // If have old version, and received code-signature is valid but older
                    // Then, fallback to current version
                    printLog(
                      'Warning: Downgrade-attack. Fetched an older version from network. Using current version.',
                      lastSeen
                    )
                    resolve({ ok: false, fallback: lastSeen })
                  }
                } else if (lastSeen && !isSignatureValid) {
                  // If have old version, but received code-signature is invalid
                  // Then, fallback to old version
                  printLog('Warning: Remote Security Check Failed! Using older version.', lastSeen)
                  resolve({ ok: false, fallback: lastSeen })
                } else if (!lastSeen && !isSignatureValid) {
                  // If no old version, and received signature is invalid
                  resolve({ ok: false, fallback: null })
                }
              }
            }
          })

          return promise
            .catch(err => {
              printLog('Warning: IndexedDB Error', err)
              return { ok: isSignatureValid }
            })
            .then(({ ok, fallback }) => {
              if (!ok && !fallback) {
                const errorMessage =
                  'Security Breach! Remote application code has been tampered with! Please contact KeyHub Support immediately.'
                printLog(errorMessage, detachedSigText)
                throw new Error(errorMessage)
              }
              if (!ok && fallback) {
                const {
                  code: fallbackCode,
                  signature: fallbackSignature,
                  type: fallbackContentType,
                } = fallback

                const verifyFallbackParams = {
                  message: openpgp.message.fromBinary(new Uint8Array(fallbackCode)), // input as Message object
                  signature: openpgp.signature.readArmored(fallbackSignature), // parse detached signature
                  publicKeys: openpgp.key.readArmored(pubkeyText).keys, // for verification
                }

                return openpgp.verify(verifyFallbackParams).then(({ signatures: sigs }) => {
                  const { keyid: fallbackKeyid, valid: isFallbackValid } = sigs[0]

                  if (!isFallbackValid) {
                    const errorMessage =
                      'Security Breach! Local application code has been tampered with! Please contact KeyHub Support immediately.'
                    printLog(errorMessage, sigs[0])
                    throw new Error(errorMessage)
                  }

                  printLog(
                    `Security Check Passed! Fallback script signed by PGP key id ${fallbackKeyid.toHex()}`
                  )

                  // Return objectUrl of fallback script
                  const blob = new Blob([fallbackCode], { type: fallbackContentType })
                  return URL.createObjectURL(blob)
                })
              }

              // Else: return objectUrl of main script
              const blob = new Blob([scriptBuffer], { type: scriptContentType })
              return URL.createObjectURL(blob)
            })
        })
      })
  })
  .then(localBlobURL => {
    printLog('Loading main script...')
    return new Promise((resolve, reject) => {
      const payloadScript = document.createElement('script')
      payloadScript.type = 'text/javascript'
      payloadScript.src = localBlobURL
      payloadScript.crossOrigin = 'anonymous'
      payloadScript.async = false
      payloadScript.onload = resolve
      payloadScript.onerror = event => reject(event.error || event.target.src)
      const firstScript = document.getElementsByTagName('script')[0]
      if (firstScript) firstScript.parentNode.insertBefore(payloadScript, firstScript)
      else document.head.appendChild(payloadScript)
    })
  })
  .then(() => {
    printLog('Ready')
    document.getElementById('loader').style.display = 'none' // eslint-disable-line no-undef
  })
  .catch(error => {
    const errorMessage = `Fatal Error: ${error.message || error}`
    window.alert(errorMessage) // eslint-disable-line no-alert
    // setTimeout(() => self.close(), 5000) // eslint-disable-line no-restricted-globals
  })
