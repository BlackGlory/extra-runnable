const { delay } = require('./utils')

exports.default = async function () {
  while (true) {
    await delay(100)
  }
}
