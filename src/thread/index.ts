import { createClient } from '@delight-rpc/worker-threads'
import { ClientProxy } from 'delight-rpc'
import { Worker } from 'node:worker_threads'
import { Deferred } from 'extra-promise'
import { ITask } from '@src/types.js'
import { TaskState, taskSchema } from '@fsm/task.js'
import { IAPI } from './types.js'
import { pass, assert } from '@blackglory/prelude'
import { FiniteStateMachine } from '@blackglory/structures'
import { fileURLToPath } from 'node:url'

const workerFilename = fileURLToPath(new URL('./worker.js', import.meta.url))

export class ThreadTask<Result, Args extends unknown[]> implements ITask<Result, Args> {
  private task?: Deferred<void>
  private worker?: Worker
  private client?: ClientProxy<IAPI<Result, Args>>
  private cancelClient?: () => void
  private fsm = new FiniteStateMachine(taskSchema, TaskState.Created)

  constructor(private filename: string) {}

  getStatus(): TaskState {
    return this.fsm.state
  }

  async init(): Promise<void> {
    this.fsm.send('init')
    try {
      this.worker = new Worker(workerFilename)
      ;[this.client, this.cancelClient] = createClient<IAPI<Result, Args>>(this.worker)
      await this.client.init(this.filename)
      this.fsm.send('inited')
    } catch (e) {
      this.fsm.send('error')
      throw e
    }
  }

  async run(...args: Args): Promise<Result> {
    this.fsm.send('start')
    assert(this.client, 'client is undefined')

    this.task = new Deferred<void>()
    Promise.resolve(this.task).catch(pass)

    try {
      const promise = this.client.run(...args)
      this.fsm.send('started')
      const result = await promise

      if (this.fsm.matches(TaskState.Stopping)) {
        this.fsm.send('stopped')
      } else {
        this.fsm.send('complete')
      }
      this.task.resolve()
      return result
    } catch (e) {
      if (this.fsm.matches(TaskState.Stopping)) {
        this.fsm.send('stopped')
      } else {
        this.fsm.send('error')
      }
      this.task?.reject(e)
      throw e
    }
  }

  async abort(): Promise<void> {
    this.fsm.send('stop')
    assert(this.client, 'client is undefined')

    await this.client.abort()
    await this.task
  }

  destroy(): void {
    this.fsm.send('destroy')

    this.cancelClient?.()
    this.worker?.terminate()

    delete this.cancelClient
    delete this.worker
    delete this.client
    delete this.task
  }
}
