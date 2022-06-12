const { delay } = require('./utils.cjs')

exports.default = async function (signal, text) {
  await delay(100)
  return text
}
