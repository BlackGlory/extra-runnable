import { ITask, TaskFunction } from '@src/types.js'
import { Deferred } from 'extra-promise'
import { pass, assert, isntUndefined } from '@blackglory/prelude'
import { FiniteStateMachine } from '@blackglory/structures'
import { taskSchema, TaskState } from '@fsm/task.js'
import { AbortController } from 'extra-abort'
import { importTaskFunction } from '@utils/import-task-function.js'

abstract class AsyncTask<Result, Args extends unknown[]> implements ITask<Result, Args> {
  protected controller?: AbortController
  protected task?: Deferred<void>
  protected fsm = new FiniteStateMachine(taskSchema, TaskState.Created)
  protected taskFunction?: TaskFunction<Result, Args>

  getStatus(): TaskState {
    return this.fsm.state
  }

  abstract init(): Promise<void>

  async run(...args: Args): Promise<Result> {
    this.fsm.send('start')

    const controller = new AbortController()
    this.controller = controller

    this.task = new Deferred<void>()
    Promise.resolve(this.task).catch(pass)

    try {
      assert(isntUndefined(this.taskFunction), 'module is undefined')
      const promise = this.taskFunction(controller.signal, ...args)
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

export class AsyncTaskFromModule<Result, Args extends unknown[]> extends AsyncTask<Result, Args> {
  constructor(private filename: string) {
    super()
  }

  async init(): Promise<void> {
    this.fsm.send('init')
    try {
      this.taskFunction = await importTaskFunction<Result, Args>(this.filename)
      this.fsm.send('inited')
    } catch (e) {
      this.fsm.send('error')
      throw e
    }
  }
}

export class AsyncTaskFromFunction<Result, Args extends unknown[]> extends AsyncTask<Result, Args> {
  constructor(taskFunction: TaskFunction<Result, Args>) {
    super()
    this.taskFunction = taskFunction
  }

  async init(): Promise<void> {
    this.fsm.send('init')
    try {
      this.fsm.send('inited')
    } catch (e) {
      this.fsm.send('error')
      throw e
    }
  }
}
