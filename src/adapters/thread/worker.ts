import { createServer } from '@delight-rpc/worker-threads'
import { parentPort, isMainThread } from 'worker_threads'
import { IAPI } from './types.js'
import { WorkerState, workerSchema } from '@fsm/worker.js'
import { FiniteStateMachine } from '@blackglory/structures'
import { assert } from '@blackglory/errors'
import { AbortController } from 'extra-abort'
import { importTaskFunction } from '@utils/import-task-function.js'
import { TaskFunction } from '@src/types'

assert(!isMainThread, 'This worker should not be run on main thread')
assert(parentPort, 'This worker should be run on worker thread')

const fsm = new FiniteStateMachine(workerSchema, WorkerState.Idle)
let controller: AbortController
let mainFunction: TaskFunction<unknown, unknown[]>

createServer<IAPI<unknown, unknown[]>>(
  {
    getStatus
  , init
  , run
  , abort
  }
, parentPort
)

async function init(filename: string): Promise<void> {
  mainFunction = await importTaskFunction(filename)
}

async function run(...args: unknown[]): Promise<unknown> {
  controller = new AbortController()

  fsm.send('start')

  if (controller.signal.aborted) return fsm.send('end')
  fsm.send('started')
  try {
    return await mainFunction(controller.signal, ...args)
  } finally {
    fsm.send('end')
  }
}

function abort(): void {
  fsm.send('abort')

  controller.abort()
}

function getStatus(): WorkerState {
  return fsm.state
}
