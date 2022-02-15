const { delay } = require('./utils.cjs')

exports.default = async function () {
  await delay(100)
  throw new Error('error')
}
