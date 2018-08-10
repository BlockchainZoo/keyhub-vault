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
  const open = indexedDB.open('vaultdb', 1)

  // Create the schema
  open.onupgradeneeded = () => {
    const db = open.result
    const store = db.createObjectStore(storeName, { keyPath: 'id' })
    store.createIndex('addressIndex', ['platform', 'address'])
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
