import { ITask, TaskFunction } from '@src/types.js'
import { Deferred } from 'extra-promise'
import { pass, assert, isntUndefined } from '@blackglory/prelude'
import { FiniteStateMachine } from '@blackglory/structures'
import { taskSchema, TaskState } from '@fsm/task.js'
import { AbortController } from 'extra-abort'
import { importTaskFunction } from '@utils/import-task-function.js'

export class AsyncTask<Result, Args extends unknown[]> implements ITask<Result, Args> {
  private controller?: AbortController
  private task?: Deferred<void>
  private fsm = new FiniteStateMachine(taskSchema, TaskState.Created)
  private mainFunction?: TaskFunction<Result, Args>

  constructor(private filename: string) {}

  getStatus(): TaskState {
    return this.fsm.state
  }

  async init(): Promise<void> {
    this.fsm.send('init')
    try {
      this.mainFunction = await importTaskFunction<Result, Args>(this.filename)
      this.fsm.send('inited')
    } catch (e) {
      this.fsm.send('error')
      throw e
    }
  }

  async run(...args: Args): Promise<Result> {
    this.fsm.send('start')

    const controller = new AbortController()
    this.controller = controller

    this.task = new Deferred<void>()
    Promise.resolve(this.task).catch(pass)

    try {
      assert(isntUndefined(this.mainFunction), 'module is undefined')
      const promise = this.mainFunction(controller.signal, ...args)
      this.fsm.send('started')
      const result = await promise

      if (this.fsm.matches(TaskState.Stopping)) {
        this.fsm.send('stopped')
      } else {
        this.fsm.send('complete')
      }
      this.task?.resolve()
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
    assert(this.controller, 'controller is undefined')

    this.controller.abort()
    await this.task
  }

  destroy(): void {
    this.fsm.send('destroy')

    delete this.controller
    delete this.task
  }
}
