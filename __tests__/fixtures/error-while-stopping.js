const { delay } = require('./utils')

exports.default = async function (signal) {
  while (true) {
    await delay(100)
    if (signal.aborted) throw new Error('error while stopping')
  }
}
