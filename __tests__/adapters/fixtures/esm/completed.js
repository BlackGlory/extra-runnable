import { delay } from './utils.js'

export default async function (signal, password) {
  await delay(100)
  if (password !== 'password') throw new Error('Invalid password')
}
