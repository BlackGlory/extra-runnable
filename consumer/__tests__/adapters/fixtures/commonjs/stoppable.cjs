const { delay } = require('./utils.cjs')

exports.default = async function (signal, password) {
  while (true) {
    await delay(100)
    if (signal.aborted) {
      if (password !== 'password') throw new Error('Invalid password')
      break
    }
  }
}
