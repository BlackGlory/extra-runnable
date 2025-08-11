import { delay } from 'extra-promise'
import { assert } from '@blackglory/prelude'

let destroyed = false

export default async function (signal, command, ...args) {
  assert(!destroyed, 'Destroyed')

  await delay(100)

  switch (command) {
    case 'error': throw new Error()
    case 'echo': return args
    case 'loop': {
      while (true) {
        signal.throwIfAborted()

        await delay(100)
      }
    }
    default: throw new Error('Unknown command')
  }
}

export function destroy() {
  destroyed = true
}
