import { createServer } from '@delight-rpc/child-process'
import { ITaskModule } from '@src/types'
import { IAPI, WorkerStatus } from './types'
import { assert } from '@blackglory/errors'
import { AbortController } from 'abort-controller'

let status: WorkerStatus = WorkerStatus.Idle
let controller: AbortController

createServer<IAPI>({ run, abort, getStatus }, process)

async function run(filename: string, params: unknown): Promise<void> {
  assert(status === WorkerStatus.Idle)
  status = WorkerStatus.Running

  const module = require(filename) as ITaskModule<unknown>
  controller = new AbortController()
  try {
    await module.default(controller.signal, params)
  } finally {
    status = WorkerStatus.Idle
  }
}

function abort(): void {
  assert(status === WorkerStatus.Running)
  status = WorkerStatus.Aborting

  controller.abort()
}

function getStatus(): WorkerStatus {
  return status
}
