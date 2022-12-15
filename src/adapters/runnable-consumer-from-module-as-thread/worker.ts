import { createServer } from '@delight-rpc/worker-threads'
import { parentPort, isMainThread } from 'worker_threads'
import { IAPI } from './types.js'
import { WorkerState, workerSchema } from './fsm.js'
import { FiniteStateMachine } from 'extra-fsm'
import { assert } from '@blackglory/errors'
import { AbortController } from 'extra-abort'
import { importConsumerModule } from '@utils/import-consumer-module.js'
import { Consumer } from '@src/types.js'
import { bind } from 'extra-proxy'

assert(!isMainThread, 'This worker should not be run on main thread')
assert(parentPort, 'This worker should be run on worker thread')

class Worker {
  static fsm = new FiniteStateMachine(workerSchema, WorkerState.Idle)
  static controller: AbortController
  static fn: Consumer<unknown>

  static async init(filename: string): Promise<void> {
    const module = await importConsumerModule(filename)
    this.fn = module.default
  }

  static async run(params: unknown): Promise<void> {
    this.controller = new AbortController()

    this.fsm.send('start')

    if (this.controller.signal.aborted) return this.fsm.send('end')
    this.fsm.send('started')
    try {
      await this.fn(this.controller.signal, params)
    } finally {
      this.fsm.send('end')
    }
  }

  static abort(): void {
    this.fsm.send('abort')

    this.controller.abort()
  }

  static getState(): WorkerState {
    return this.fsm.state
  }
}

createServer<IAPI<unknown>>(Worker, parentPort)
