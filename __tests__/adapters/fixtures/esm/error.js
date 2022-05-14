import { delay } from './utils.js'

export default async function () {
  await delay(100)
  throw new Error('error')
}
