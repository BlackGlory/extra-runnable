import { createServer } from '@delight-rpc/child-process'
import { IAPI } from './types.js'
import { WorkerState, workerSchema } from '@fsm/worker.js'
import { FiniteStateMachine } from '@blackglory/structures'
import { AbortController } from 'extra-abort'
import { importTaskFunction } from '@utils/import-task-function.js'
import { TaskFunction } from '@src/types.js'

const fsm = new FiniteStateMachine(workerSchema, WorkerState.Idle)
let controller: AbortController
let mainFunction: TaskFunction<unknown, unknown[]>

createServer<IAPI<unknown, unknown[]>>(
  {
    init
  , run
  , abort
  , getStatus
  }
, process
)
process.send!('ready')

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
