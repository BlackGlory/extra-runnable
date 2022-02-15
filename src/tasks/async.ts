import { ITaskFactory, Mode, ITask, TaskStatus, FatalError } from '@src/types.js'
import { Deferred } from 'extra-promise'
import { pass } from '@blackglory/pass'
import { go } from '@blackglory/go'
import { FiniteStateMachine } from '@blackglory/structures'
import { schema } from '@tasks/utils.js'
import { AbortController } from 'extra-abort'
import { importTaskModule } from '@utils/import-module.js'

class AsyncTask<T> implements ITask<T> {
  private controller?: AbortController
  private task?: Deferred<void>
  private fsm = new FiniteStateMachine(schema, TaskStatus.Ready)

  constructor(private filename: string) {}

  getStatus() {
    return this.fsm.state
  }

  async start(params: T): Promise<void> {
    this.fsm.send('start')

    let module
    try {
      module = await importTaskModule(this.filename)
    } catch (e) {
      throw new FatalError(e)
    }
    const controller = new AbortController()
    this.controller = controller

    this.task = new Deferred<void>()
    Promise.resolve(this.task).catch(pass)

    try {
      const promise = module.default(controller.signal, params)
      this.fsm.send('started')
      await promise

      if (this.fsm.matches(TaskStatus.Stopping)) {
        this.fsm.send('stopped')
      } else {
        this.fsm.send('complete')
      }
      this.task?.resolve()
    } catch (e) {
      go(() => {
        if (this.fsm.matches(TaskStatus.Stopping)) {
          this.fsm.send('stopped')
        } else {
          this.fsm.send('error')
        }
      })
      this.task?.reject(e)
      throw e
    } finally {
      this.destroy()
    }
  }

  async stop(): Promise<void> {
    this.fsm.send('stop')

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
    return new AsyncTask(this.filename)
  }
}
