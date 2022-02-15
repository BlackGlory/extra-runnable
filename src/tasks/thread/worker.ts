import { createServer } from '@delight-rpc/worker-threads'
import { parentPort, isMainThread } from 'worker_threads'
import { IAPI, WorkerStatus, schema } from './types.js'
import { FatalError, ITaskModule } from '@src/types.js'
import { FiniteStateMachine } from '@blackglory/structures'
import { assert } from '@blackglory/errors'
import { AbortController } from 'extra-abort'
import { importTaskModule } from '@utils/import-module.js'

assert(!isMainThread, 'This worker should not be run on main thread')
assert(parentPort, 'This worker should be run on worker thread')

const fsm = new FiniteStateMachine(schema, WorkerStatus.Idle)
let controller: AbortController

createServer<IAPI>({ run, abort, getStatus }, parentPort)

async function run(filename: string, params: unknown): Promise<void> {
  controller = new AbortController()

  fsm.send('start')
  let module: ITaskModule<unknown>
  try {
    module = await importTaskModule(filename)
  } catch (e) {
    throw new FatalError(e)
  }

  if (controller.signal.aborted) return fsm.send('end')
  fsm.send('started')
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
