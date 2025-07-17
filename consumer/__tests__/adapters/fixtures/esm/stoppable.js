import { delay } from './utils.js'

export default async function (signal, password) {
  while (true) {
    await delay(100)
    if (signal.aborted) {
      if (password !== 'password') throw new Error('Invalid password')
      break
    }
  }
}
