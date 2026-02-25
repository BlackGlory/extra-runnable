import { delay } from 'extra-promise'
import { assert } from '@blackglory/prelude'
import os from 'os'
import path from 'path'
import fs from 'fs/promises'

const stateFilename = path.join(os.tmpdir(), 'extra-runnable-test')
await fs.writeFile(stateFilename, 'inited')

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

export async function destroy() {
  destroyed = true
  await fs.writeFile(stateFilename, 'destroyed')
}
