import { Deferred } from 'extra-promise'
import { IAdapter } from '@src/types.js'
import { TaskState, taskSchema } from '@fsm/task.js'
import { pass } from '@blackglory/prelude'
import { FiniteStateMachine } from '@blackglory/structures'

export { TaskState } from '@fsm/task.js'

export class Task<Result, Args extends unknown[]> {
  private task?: Deferred<void>
  private fsm = new FiniteStateMachine(taskSchema, TaskState.Created)

  constructor(private adapter: IAdapter<Result, Args>) {}

  getStatus(): TaskState {
    return this.fsm.state
  }

  async init(): Promise<void> {
    this.fsm.send('init')
    try {
      await this.adapter.init()
      this.fsm.send('inited')
    } catch (e) {
      this.fsm.send('error')
      throw e
    }
  }

  async run(...args: Args): Promise<Result> {
    this.fsm.send('start')

    this.task = new Deferred<void>()
    Promise.resolve(this.task).catch(pass)

    try {
      const promise = this.adapter.run(...args)
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

    await this.adapter.abort()
    await this.task
  }

  async destroy(): Promise<void> {
    this.fsm.send('destroy')

    await this.adapter.destroy()

    delete this.task
  }
}
