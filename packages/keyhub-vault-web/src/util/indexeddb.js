'use strict'

// eslint-disable-next-line
const callOnStore = (storeName, fn, window = window || self) => {
  // This works on all devices/browsers, and uses IndexedDBShim as a final fallback
  const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB

  // Open (or create) the database
  const open = indexedDB.open('vaultdb', 2)

  // Create the schema
  open.onupgradeneeded = event => {
    const db = open.result
    if (event.oldVersion < 1) {
      const accounts = db.createObjectStore('accounts', { keyPath: 'id' })
      accounts.createIndex('addressIndex', ['address'])
    }
    if (event.oldVersion < 2) {
      db.createObjectStore('prefs', {})
    }
  }

  open.onsuccess = () => {
    // Start a new transaction
    const db = open.result
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)

    // Close the db when the transaction errors
    tx.onerror = error => {
      db.close()
      throw error
    }

    fn(store)

    // Close the db when the transaction is done
    tx.oncomplete = () => {
      db.close()
    }
  }

  open.onerror = error => {
    throw error
  }
}

module.exports = {
  callOnStore,
}
