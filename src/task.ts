import { Deferred } from 'extra-promise'
import { IAdapter } from '@src/types.js'
import { pass } from '@blackglory/prelude'
import { FiniteStateMachine } from '@blackglory/structures'
import { IFiniteStateMachineSchema } from '@blackglory/structures'

type TaskEvent =
| 'init'
| 'inited'
| 'start'
| 'started'
| 'stop'
| 'stopped'
| 'complete'
| 'error'
| 'destroy'

export enum TaskState {
  Created = 'created'
, Initializing = 'initializing'
, Ready = 'ready'
, Starting = 'starting'
, Running = 'running'
, Stopping = 'stopping'
, Stopped = 'stopped'
, Completed = 'completed'
, Error = 'error'
, Destroyed = 'destroyed'
}

const taskSchema: IFiniteStateMachineSchema<TaskState, TaskEvent> = {
  [TaskState.Created]: {
    init: TaskState.Initializing
  }
, [TaskState.Initializing]: {
    inited: TaskState.Ready
  , error: TaskState.Error
  }
, [TaskState.Ready]: {
    start: TaskState.Starting
  , destroy: TaskState.Destroyed
  }
, [TaskState.Starting]: {
    started: TaskState.Running
  , error: TaskState.Error
  }
, [TaskState.Running]: {
    stop: TaskState.Stopping
  , complete: TaskState.Completed
  , error: TaskState.Error
  }
, [TaskState.Stopping]: {
    stopped: TaskState.Stopped
  }
, [TaskState.Stopped]: {
    destroy: TaskState.Destroyed
  }
, [TaskState.Completed]: {
    destroy: TaskState.Destroyed
  }
, [TaskState.Error]: {
    destroy: TaskState.Destroyed
  }
, [TaskState.Destroyed]: {}
}


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
