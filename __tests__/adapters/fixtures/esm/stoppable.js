import { delay } from './utils.js'

export default async function (signal) {
  while (true) {
    await delay(100)
    if (signal.aborted) break
  }
}
