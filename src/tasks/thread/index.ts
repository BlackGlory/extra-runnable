import { createClient } from '@delight-rpc/worker-threads'
import { ClientProxy } from 'delight-rpc'
import { Worker } from 'worker_threads'
import { Deferred } from 'extra-promise'
import { ITaskFactory, Mode, ITask, TaskStatus } from '@src/types'
import { IAPI } from './types'
import { pass } from '@blackglory/pass'
import { go } from '@blackglory/go'
import * as path from 'path'
import { FiniteStateMachine } from '@blackglory/structures'
import { schema } from '@tasks/utils'

const workerFilename = path.resolve(__dirname, './worker.js')

class ThreadTask<T> implements ITask<T> {
  private task?: Deferred<void>
  private worker?: Worker
  private client?: ClientProxy<IAPI>
  private cancelClient?: () => void
  private fsm = new FiniteStateMachine(schema, TaskStatus.Ready)

  constructor(private filename: string) {}

  getStatus() {
    return this.fsm.state
  }

  async start(params: T): Promise<void> {
    this.fsm.send('run')

    this.worker = new Worker(workerFilename)
    ;[this.client, this.cancelClient] = createClient<IAPI>(this.worker)

    this.task = new Deferred<void>()
    Promise.resolve(this.task).catch(pass)

    await go(async () => {
      try {
        await this.client?.run(this.filename, params)

        if (this.fsm.matches(TaskStatus.Stopping)) {
          this.fsm.send('stopEnd')
        } else {
          this.fsm.send('complete')
        }
        this.task?.resolve()
      } catch (e) {
        if (this.fsm.matches(TaskStatus.Stopping)) {
          this.fsm.send('stopEnd')
        } else {
          this.fsm.send('error')
        }
        this.task?.reject(e)
        throw e
      } finally {
        this.destroy()
      }
    })
  }

  async stop(): Promise<void> {
    this.fsm.send('stopBegin')

    await this.client!.abort()
    await this.task
  }

  destroy() {
    this.cancelClient?.()
    this.worker?.terminate()

    delete this.cancelClient
    delete this.worker
    delete this.client
    delete this.task
  }
}

export class ThreadTaskFactory<T> implements ITaskFactory<T> {
  readonly mode = Mode.Thread

  constructor(public filename: string) {}

  create(): ThreadTask<T> {
    return new ThreadTask(this.filename)
  }
}
