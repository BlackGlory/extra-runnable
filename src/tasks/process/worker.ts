import { createServer } from '@delight-rpc/child-process'
import { IAPI, WorkerStatus, schema } from './types.js'
import { FiniteStateMachine } from '@blackglory/structures'
import { AbortController } from 'extra-abort'
import { importTaskModule } from '@utils/import-module.js'
import { FatalError, ITaskModule } from '@src/types.js'

const fsm = new FiniteStateMachine(schema, WorkerStatus.Idle)
let controller: AbortController

createServer<IAPI>({ run, abort, getStatus }, process)
process.send!('ready')

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
