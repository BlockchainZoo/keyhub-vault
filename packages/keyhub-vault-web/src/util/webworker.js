'use strict'

const postMessage = (worker, ...rest) =>
  new Promise((resolve, reject) => {
    worker.onmessage = resolve // eslint-disable-line no-param-reassign
    worker.onerror = reject // eslint-disable-line no-param-reassign
    worker.postMessage(...rest)
  }).then(({ data }) => {
    if (data.error) {
      const err = new Error()
      throw Object.assign(err, data.error)
    }
    return data
  })

module.exports = {
  postMessage,
}
