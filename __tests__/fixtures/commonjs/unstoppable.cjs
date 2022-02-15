const { delay } = require('./utils.cjs')

exports.default = async function () {
  while (true) {
    await delay(100)
  }
}
