import { delay } from './utils.js'

export default async function (signal, text) {
  await delay(100)
  return text
}
