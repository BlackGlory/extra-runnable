import { Deferred } from 'extra-promise'
import { pass } from '@blackglory/prelude'
import { FiniteStateMachine, IFiniteStateMachineSchema } from 'extra-fsm'
import { IRunnable } from './runnable.js'

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

export enum RunnerState {
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

const schema: IFiniteStateMachineSchema<RunnerState, Event> = {
  [RunnerState.Created]: {
    init: RunnerState.Initializing
  }
, [RunnerState.Initializing]: {
    inited: RunnerState.Ready
  , crash: RunnerState.Crashed
  }
, [RunnerState.Crashed]: {
    init: RunnerState.Initializing
  }
, [RunnerState.Ready]: {
    start: RunnerState.Starting
  , destroy: RunnerState.Destroyed
  }
, [RunnerState.Starting]: {
    started: RunnerState.Running
  , error: RunnerState.Error
  }
, [RunnerState.Running]: {
    stop: RunnerState.Stopping
  , complete: RunnerState.Completed
  , error: RunnerState.Error
  }
, [RunnerState.Stopping]: {
    stopped: RunnerState.Stopped
  , stop: RunnerState.Stopping
  }
, [RunnerState.Stopped]: {
    destroy: RunnerState.Destroyed
  , start: RunnerState.Starting
  }
, [RunnerState.Completed]: {
    destroy: RunnerState.Destroyed
  , start: RunnerState.Starting
  }
, [RunnerState.Error]: {
    destroy: RunnerState.Destroyed
  , start: RunnerState.Starting
  }
, [RunnerState.Destroyed]: {}
}

export class Runner<Args extends unknown[], Result> {
  private task?: Deferred<void>
  private fsm = new FiniteStateMachine(schema, RunnerState.Created)

  constructor(private adapter: IRunnable<Args, Result>) {}

  getState(): RunnerState {
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

      if (this.fsm.matches(RunnerState.Stopping)) {
        this.fsm.send('stopped')
      } else {
        this.fsm.send('complete')
      }
      this.task.resolve()
      return result
    } catch (e) {
      if (this.fsm.matches(RunnerState.Stopping)) {
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
