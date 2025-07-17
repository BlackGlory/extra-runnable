const { delay } = require('./utils.cjs')

exports.default = async function (signal, password) {
  await delay(100)
  if (password !== 'password') throw new Erorr('Invalid password')
}
