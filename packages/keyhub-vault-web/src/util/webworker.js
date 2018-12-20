'use strict'

const postMessage = (worker, payload, transferables = []) =>
  new Promise((resolve, reject) => {
    // Create a new channel for each postMessage to support concurrent results
    const resultChannel = new MessageChannel() // eslint-disable-line no-undef
    const resultPort = resultChannel.port2
    resultChannel.port1.onmessage = resolve // eslint-disable-line no-param-reassign

    // Unhandled errors
    worker.onerror = errEvent => reject(errEvent.error || new Error(errEvent.message)) // eslint-disable-line no-param-reassign

    worker.postMessage({ payload, resultPort }, [resultPort, ...transferables])
  }).then(({ data }) => {
    if (data.error) {
      const err = new Error(data.error.message)
      delete data.error.message // eslint-disable-line no-param-reassign
      throw Object.assign(err, data.error)
    }
    return data
  })

const normalize = obj => {
  /* eslint-disable no-undef */

  // Primitves
  if (typeof obj !== 'object') return obj

  // Structured-clonables
  if (
    (typeof Boolean !== 'undefined' && obj instanceof Boolean) ||
    (typeof String !== 'undefined' && obj instanceof String) ||
    (typeof Date !== 'undefined' && obj instanceof Date) ||
    (typeof RegExp !== 'undefined' && obj instanceof RegExp) ||
    (typeof Blob !== 'undefined' && obj instanceof Blob) ||
    (typeof File !== 'undefined' && obj instanceof File) ||
    (typeof FileList !== 'undefined' && obj instanceof FileList) ||
    (typeof ArrayBuffer !== 'undefined' && obj instanceof ArrayBuffer) ||
    (typeof Int8Array !== 'undefined' && obj instanceof Int8Array) ||
    (typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array) ||
    (typeof Uint8ClampedArray !== 'undefined' && obj instanceof Uint8ClampedArray) ||
    (typeof Int16Array !== 'undefined' && obj instanceof Int16Array) ||
    (typeof Uint16Array !== 'undefined' && obj instanceof Uint16Array) ||
    (typeof Int32Array !== 'undefined' && obj instanceof Int32Array) ||
    (typeof Uint32Array !== 'undefined' && obj instanceof Uint32Array) ||
    (typeof Float32Array !== 'undefined' && obj instanceof Float32Array) ||
    (typeof Float64Array !== 'undefined' && obj instanceof Float64Array) ||
    (typeof ImageData !== 'undefined' && obj instanceof ImageData)
  ) {
    return obj
  }

  // Collections
  if (obj instanceof Array) {
    const acc = []
    obj.forEach((val, idx) => {
      acc[idx] = normalize(val)
    })
    return obj
  }
  if (obj instanceof Map) {
    const acc = []
    obj.forEach((val, key) => acc.push([normalize(key), normalize(val)]))
    return new Map(acc)
  }
  if (obj instanceof Set) {
    const acc = []
    obj.forEach(val => acc.push(val))
    return new Set(acc)
  }

  // Other types
  return Object.getOwnPropertyNames(obj).reduce((acc, key) => {
    acc[key] = normalize(obj[key])
    return acc
  }, Object.create(null))
}

module.exports = {
  postMessage,
  normalizeMessage: normalize,
}
