import { createServer } from '@delight-rpc/worker-threads'
import { parentPort, isMainThread } from 'worker_threads'
import { ITaskModule } from '@src/types'
import { IAPI, WorkerStatus, schema } from './types'
import { FiniteStateMachine } from '@blackglory/structures'
import { assert } from '@blackglory/errors'
import { AbortController } from 'extra-abort'

assert(!isMainThread)
assert(parentPort)

const fsm = new FiniteStateMachine(schema, WorkerStatus.Idle)
let controller: AbortController

createServer<IAPI>({ run, abort, getStatus }, parentPort)

async function run(filename: string, params: unknown): Promise<void> {
  fsm.send('run')

  const module = require(filename) as ITaskModule<unknown>
  controller = new AbortController()
  try {
    await module.default(controller.signal, params)
  } finally {
    fsm.send('end')
  }
}

function abort(): void {
  fsm.send('abort')

  controller.abort()
}

function getStatus(): WorkerStatus {
  return fsm.state
}
