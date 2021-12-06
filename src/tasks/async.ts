import { ITaskFactory, Mode, ITask, ITaskModule, TaskStatus } from '@src/types'
import { AbortController } from 'abort-controller'
import { assert } from '@blackglory/errors'
import { Deferred } from 'extra-promise'
import { isFunction } from '@blackglory/types'
import { pass } from '@blackglory/pass'
import { go } from '@blackglory/go'

class AsyncTask<T> implements ITask<T> {
  private status = TaskStatus.Ready
  private controller?: AbortController
  private task?: Deferred<void>

  constructor(private module: ITaskModule<T>) {}

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

    const controller = new AbortController()
    this.controller = controller

    this.task = new Deferred<void>()
    Promise.resolve(this.task).catch(pass)

    await go(async () => {
      try {
        await this.module.default(controller.signal, params)
        if (this.status === TaskStatus.Stopping) {
          this.setStatus(TaskStatus.Stopped)
        } else {
          this.setStatus(TaskStatus.Completed)
        }
        this.task?.resolve()
      } catch (e) {
        go(() => {
          if (this.status === TaskStatus.Stopping) {
            this.setStatus(TaskStatus.Stopped)
          } else {
            this.setStatus(TaskStatus.Error)
          }
        })
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

    this.controller!.abort()
    await this.task
  }

  destroy() {
    delete this.controller
    delete this.task
  }
}

export class AsyncTaskFactory<T> implements ITaskFactory<T> {
  readonly mode = Mode.Async

  constructor(public filename: string) {}

  create(): ITask<T> {
    const module = require(this.filename) as ITaskModule<T>
    assert(isFunction(module.default))

    return new AsyncTask(module)
  }
}
