const { delay } = require('./utils')

exports.default = async function () {
  await delay(100)
  throw new Error('error')
}
