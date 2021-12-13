import { ITask, ITaskFactory, DaemonStatus, IMetaModule, Reason, IAPI, TaskStatus } from '@src/types'
import { exitProcess } from '@utils/exit-process'
import { parseConcurrency } from '@utils/parse-concurrency'
import { isString, isntNull } from '@blackglory/types'
import { find } from 'iterable-operator'
import { go } from '@blackglory/go'
import { Mutex, ReusableDeferred, delay } from 'extra-promise'
import { debug as createDebug } from 'debug'
import { calculateExponentialBackoffTimeout } from 'extra-timers'
import { pass } from '@blackglory/pass'
import ms from 'ms'
import { FiniteStateMachine, IFiniteStateMachineSchema } from '@blackglory/structures'
const debug = createDebug('daemon')

type Event = 'normal' | 'idle' | 'scale' | 'exit'
const schema: IFiniteStateMachineSchema<DaemonStatus, Event> = {
  [DaemonStatus.Idle]: {
    normal: DaemonStatus.Running
  , scale: DaemonStatus.Scaling
  , exit: DaemonStatus.Exiting
  }
, [DaemonStatus.Running]: {
    exit: DaemonStatus.Exiting
  , scale: DaemonStatus.Scaling
  }
, [DaemonStatus.Scaling]: {
    exit: DaemonStatus.Exiting
  , idle: DaemonStatus.Idle
  , normal: DaemonStatus.Running
  }
, [DaemonStatus.Exiting]: {}
}

export class Daemon implements IAPI {
  private id: string
  private label: string
  private tasks = new Set<ITask<unknown>>()
  private scaleLock = new Mutex()
  private targetConcurrency = 0
  private taskFactory: ITaskFactory<unknown>
  protected params = new ReusableDeferred<unknown>()
  private final?: (reason: Reason, error?: Error) => void | PromiseLike<void>
  private retries = 0
  private fsm = new FiniteStateMachine(schema, DaemonStatus.Idle)

  constructor({ id, label, taskFactory, metaModule }: {
    id: string
  , label: string
  , taskFactory: ITaskFactory<unknown>
  , metaModule: IMetaModule<unknown>
  }) {
    this.id = id
    this.label = label
    this.taskFactory = taskFactory

    if (metaModule.init) {
      let emitted = false

      metaModule.init().subscribe({
        next: params => {
          emitted = true
          this.params.resolve(params)
        }
      , complete: () => {
          if (!emitted) {
            this.error(new Error('The observable complete before any value is emitted'))
          }
        }
      , error: err => this.error(err)
      })
    } else {
      this.params.resolve(undefined)
    }

    this.final = metaModule.final
  }

  ping() {
    return 'pong' as const
  }

  getInfo() {
    return {
      id: this.id
    , label: this.label
    , mode: this.taskFactory.mode
    }
  }

  getStatus(): DaemonStatus {
    return this.fsm.state
  }

  getConcurrency() {
    return {
      current: this.tasks.size
    , target: this.targetConcurrency
    }
  }
  
  setConcurrency(val: number | string): void {
    this.fsm.send('scale')

    go(async () => {
      const target = isString(val) ? parseConcurrency(val) : val
      if (isntNull(target)) {
        this.targetConcurrency = target
        await this.scale()
      }

      if (this.tasks.size === 0) {
        this.fsm.send('idle')
      } else {
        this.fsm.send('normal')
      }
    })
  }

  exit(): void {
    this.fsm.send('exit')

    go(async () => {
      this.targetConcurrency = 0
      await this.scale()

      try {
        await this.final?.(Reason.Exit)
      } finally {
        exitProcess()
      }
    })
  }

  private error(err: Error): void {
    this.fsm.send('exit')

    go(async () => {
      this.targetConcurrency = 0
      await this.scale()

      try {
        await this.final?.(Reason.Error, err)
      } finally {
        exitProcess(err)
      }
    })
  }

  private async scale(): Promise<void> {
    await this.scaleLock.acquire(async () => {
      debug('scaling concurrency %d to %d', this.tasks.size, this.targetConcurrency)

      while (this.tasks.size < this.targetConcurrency) {
        await this.startTask()
        debug('current concurrency: %d', this.tasks.size)
      }

      while (this.tasks.size > this.targetConcurrency) {
        await this.stopTask()
        debug('current concurrency: %d', this.tasks.size)
      }
    })
  }

  private async startTask(): Promise<void> {
    debug('starting a task')

    const task = this.taskFactory.create()
    this.tasks.add(task)

    task.start(await this.params).catch(pass).finally(async () => {
      if (task.getStatus() === TaskStatus.Completed) {
        this.tasks.delete(task)
        await this.scale()
      }
      
      if (task.getStatus() === TaskStatus.Error) {
        await delay(calculateExponentialBackoffTimeout({
          baseTimeout: ms('1s')
        , maxTimeout: ms('30s')
        , retries: this.retries++
        }))

        this.tasks.delete(task)
        await this.scale()
      }
    })
  }

  private async stopTask(): Promise<void> {
    debug('stopping a task')

    const task = find(this.tasks, task => {
      return task.getStatus() !== TaskStatus.Completed
          && task.getStatus() !== TaskStatus.Error
          && task.getStatus() !== TaskStatus.Stopping
          && task.getStatus() !== TaskStatus.Stopped
    })
    if (task) {
      await task.stop()
      this.tasks.delete(task)
    }
  }
}
