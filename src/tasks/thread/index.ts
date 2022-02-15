import { createClient } from '@delight-rpc/worker-threads'
import { ClientProxy } from 'delight-rpc'
import { Worker } from 'worker_threads'
import { Deferred } from 'extra-promise'
import { ITaskFactory, Mode, ITask, TaskStatus } from '@src/types.js'
import { IAPI } from './types.js'
import { pass } from '@blackglory/pass'
import { FiniteStateMachine } from '@blackglory/structures'
import { schema } from '@tasks/utils.js'
import { fileURLToPath } from 'node:url'

const workerFilename = fileURLToPath(new URL('./worker.js', import.meta.url))

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
    this.fsm.send('start')

    this.worker = new Worker(workerFilename)
    ;[this.client, this.cancelClient] = createClient<IAPI>(this.worker)

    this.task = new Deferred<void>()
    Promise.resolve(this.task).catch(pass)

    try {
      const promise = this.client?.run(this.filename, params)
      this.fsm.send('started')
      await promise

      if (this.fsm.matches(TaskStatus.Stopping)) {
        this.fsm.send('stopped')
      } else {
        this.fsm.send('complete')
      }
      this.task?.resolve()
    } catch (e) {
      if (this.fsm.matches(TaskStatus.Stopping)) {
        this.fsm.send('stopped')
      } else {
        this.fsm.send('error')
      }
      this.task?.reject(e)
      throw e
    } finally {
      this.destroy()
    }
  }

  async stop(): Promise<void> {
    this.fsm.send('stop')

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
