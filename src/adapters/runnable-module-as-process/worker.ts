import { createServer } from '@delight-rpc/child-process'
import { IAPI } from './types.js'
import { WorkerState, workerSchema } from './fsm.js'
import { FiniteStateMachine } from 'extra-fsm'
import { AbortController } from 'extra-abort'
import { importModule } from '@adapters/utils.js'
import { RawRunnableFunction } from '@adapters/types.js'
import { bind } from 'extra-proxy'

class RunnableWorker {
  static fsm = new FiniteStateMachine(workerSchema, WorkerState.Idle)
  static controller: AbortController
  static fn: RawRunnableFunction<unknown, unknown[]>

  static async init(filename: string): Promise<void> {
    this.fn = await importModule(filename)
  }

  static async run(...args: unknown[]): Promise<unknown> {
    this.controller = new AbortController()

    this.fsm.send('start')
    if (this.controller.signal.aborted) return this.fsm.send('end')
    this.fsm.send('started')
    try {
      return await this.fn(this.controller.signal, ...args)
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

const boundRunnableWorker = bind(RunnableWorker)
createServer<IAPI<unknown, unknown[]>>(
  {
    getState: boundRunnableWorker.getState
  , init: boundRunnableWorker.init
  , run: boundRunnableWorker.run
  , abort: boundRunnableWorker.abort
  }
, process
)
process.send!('ready')
