import { ITaskFactory, Mode, ITask, ITaskModule, TaskStatus } from '@src/types'
import { assert } from '@blackglory/errors'
import { Deferred } from 'extra-promise'
import { isFunction } from '@blackglory/types'
import { pass } from '@blackglory/pass'
import { go } from '@blackglory/go'
import { FiniteStateMachine } from '@blackglory/structures'
import { schema } from '@tasks/utils'
import { AbortController } from 'extra-abort'

class AsyncTask<T> implements ITask<T> {
  private controller?: AbortController
  private task?: Deferred<void>
  private fsm = new FiniteStateMachine(schema, TaskStatus.Ready)

  constructor(private module: ITaskModule<T>) {}

  getStatus() {
    return this.fsm.state
  }

  async start(params: T): Promise<void> {
    this.fsm.send('run')

    const controller = new AbortController()
    this.controller = controller

    this.task = new Deferred<void>()
    Promise.resolve(this.task).catch(pass)

    await go(async () => {
      try {
        await this.module.default(controller.signal, params)

        if (this.fsm.matches(TaskStatus.Stopping)) {
          this.fsm.send('stopEnd')
        } else {
          this.fsm.send('complete')
        }
        this.task?.resolve()
      } catch (e) {
        go(() => {
          if (this.fsm.matches(TaskStatus.Stopping)) {
            this.fsm.send('stopEnd')
          } else {
            this.fsm.send('error')
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
    this.fsm.send('stopBegin')

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
