import { Deferred } from 'extra-promise'
import { IAdapter } from '@src/types.js'
import { pass } from '@blackglory/prelude'
import { FiniteStateMachine } from '@blackglory/structures'
import { IFiniteStateMachineSchema } from '@blackglory/structures'

type Event =
| 'init'
| 'inited'
| 'start'
| 'started'
| 'stop'
| 'stopped'
| 'complete'
| 'error'
| 'destroy'
| 'crash'

export enum RunnableState {
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
, Crashed = 'crashed'
}

const schema: IFiniteStateMachineSchema<RunnableState, Event> = {
  [RunnableState.Created]: {
    init: RunnableState.Initializing
  }
, [RunnableState.Initializing]: {
    inited: RunnableState.Ready
  , crash: RunnableState.Crashed
  }
, [RunnableState.Crashed]: {
    init: RunnableState.Initializing
  }
, [RunnableState.Ready]: {
    start: RunnableState.Starting
  , destroy: RunnableState.Destroyed
  }
, [RunnableState.Starting]: {
    started: RunnableState.Running
  , error: RunnableState.Error
  }
, [RunnableState.Running]: {
    stop: RunnableState.Stopping
  , complete: RunnableState.Completed
  , error: RunnableState.Error
  }
, [RunnableState.Stopping]: {
    stopped: RunnableState.Stopped
  , stop: RunnableState.Stopping
  }
, [RunnableState.Stopped]: {
    destroy: RunnableState.Destroyed
  , start: RunnableState.Starting
  }
, [RunnableState.Completed]: {
    destroy: RunnableState.Destroyed
  , start: RunnableState.Starting
  }
, [RunnableState.Error]: {
    destroy: RunnableState.Destroyed
  , start: RunnableState.Starting
  }
, [RunnableState.Destroyed]: {}
}


export class Runnable<Result, Args extends unknown[]> {
  private task?: Deferred<void>
  private fsm = new FiniteStateMachine(schema, RunnableState.Created)

  constructor(private adapter: IAdapter<Result, Args>) {}

  getState(): RunnableState {
    return this.fsm.state
  }

  async init(): Promise<void> {
    this.fsm.send('init')
    try {
      await this.adapter.init()
      this.fsm.send('inited')
    } catch (e) {
      this.fsm.send('crash')
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

      if (this.fsm.matches(RunnableState.Stopping)) {
        this.fsm.send('stopped')
      } else {
        this.fsm.send('complete')
      }
      this.task.resolve()
      return result
    } catch (e) {
      if (this.fsm.matches(RunnableState.Stopping)) {
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
    try {
      await this.task
    } catch {
      pass()
    }
  }

  async destroy(): Promise<void> {
    this.fsm.send('destroy')

    await this.adapter.destroy()

    delete this.task
  }
}
