import { createClient } from '@delight-rpc/worker-threads'
import { ClientProxy } from 'delight-rpc'
import { Worker } from 'worker_threads'
import { assert } from '@blackglory/errors'
import { Deferred } from 'extra-promise'
import { ITaskFactory, Mode, ITask, TaskStatus } from '@src/types'
import { IAPI } from './types'
import { pass } from '@blackglory/pass'
import { go } from '@blackglory/go'
import * as path from 'path'

const workerFilename = path.resolve(__dirname, './worker.js')

class ThreadTask<T> implements ITask<T> {
  private status = TaskStatus.Ready
  private task?: Deferred<void>
  private worker?: Worker
  private client?: ClientProxy<IAPI>
  private cancelClient?: () => void

  constructor(private filename: string) {}

  getStatus() {
    return this.status
  }

  private setStatus(status: TaskStatus): void {
    this.status = status
  }

  async start(params: T): Promise<void> {
    assert(
      this.status === TaskStatus.Ready ||
      this.status === TaskStatus.Stopped ||
      this.status === TaskStatus.Completed ||
      this.status === TaskStatus.Error
    )
    this.setStatus(TaskStatus.Running)

    this.worker = new Worker(workerFilename)
    ;[this.client, this.cancelClient] = createClient<IAPI>(this.worker)

    this.task = new Deferred<void>()
    Promise.resolve(this.task).catch(pass)

    await go(async () => {
      try {
        await this.client?.run(this.filename, params)

        if (this.status === TaskStatus.Stopping) {
          this.setStatus(TaskStatus.Stopped)
        } else {
          this.setStatus(TaskStatus.Completed)
        }
        this.task?.resolve()
      } catch (e) {
        if(this.status === TaskStatus.Stopping) {
          this.setStatus(TaskStatus.Stopped)
        } else {
          this.setStatus(TaskStatus.Error)
        }
        this.task?.reject(e)
        throw e
      } finally {
        this.destroy()
      }
    })
  }

  async stop(): Promise<void> {
    assert(this.status === TaskStatus.Running)
    this.setStatus(TaskStatus.Stopping)

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
