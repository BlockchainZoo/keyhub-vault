/* eslint-disable no-undef */

const callOnStore = (storeName, fn) => {
  // This works on all devices/browsers, and uses IndexedDBShim as a final fallback
  const indexedDB = (
    window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB
    || window.msIndexedDB || window.shimIndexedDB
  )

  // Open (or create) the database
  const open = indexedDB.open('vaultdb', 1)

  // Create the schema
  open.onupgradeneeded = () => {
    const db = open.result
    db.createObjectStore(storeName, { keyPath: 'id' })
    // const store = db.createObjectStore(storeName, { keyPath: 'id' })
    // const index = store.createIndex('NameIndex', ['name.last', 'name.first'])
  }

  open.onsuccess = () => {
    // Start a new transaction
    const db = open.result
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)

    fn(store)

    // Close the db when the transaction is done
    tx.oncomplete = () => {
      db.close()
    }
  }
}

module.exports = {
  callOnStore,
}
