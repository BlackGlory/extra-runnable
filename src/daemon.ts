import { ITask, ITaskFactory, DaemonStatus, IMetaModule, Reason, IAPI, TaskStatus } from '@src/types.js'
import { exitProcess } from '@utils/exit-process.js'
import { parseConcurrency } from '@utils/parse-concurrency.js'
import { isString, isntNull } from '@blackglory/types'
import { find } from 'iterable-operator'
import { go } from '@blackglory/go'
import { Mutex, ReusableDeferred, delay } from 'extra-promise'
import createDebug from 'debug'
import { calculateExponentialBackoffTimeout } from 'extra-timers'
import ms from 'ms'
import { FiniteStateMachine, IFiniteStateMachineSchema } from '@blackglory/structures'
import { Destructor } from 'extra-defer'
import { FatalError } from './types.js'

const debug = createDebug('daemon')

type Event = 'start' | 'stop' | 'scaled' | 'idle' | 'scale' | 'exit'
const schema: IFiniteStateMachineSchema<DaemonStatus, Event> = {
  [DaemonStatus.Idle]: {
    start: DaemonStatus.Running
  , scale: DaemonStatus.Scaling
  , exit: DaemonStatus.Exiting
  }
, [DaemonStatus.Running]: {
    exit: DaemonStatus.Exiting
  , scale: DaemonStatus.Scaling
  }
, [DaemonStatus.Scaling]: {
    exit: DaemonStatus.Exiting
  , stop: DaemonStatus.Idle
  , scaled: DaemonStatus.Running
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
  private _exitProcess: (error?: Error) => void
  private destructor = new Destructor()

  constructor({ id, label, taskFactory, metaModule, _exitProcess = exitProcess }: {
    id: string
  , label: string
  , taskFactory: ITaskFactory<unknown>
  , metaModule: IMetaModule<unknown>
    // 专用于测试的注入口, 直到jest支持对mock ESM项目为止
  , _exitProcess?: (error?: Error) => void
  }) {
    this.id = id
    this.label = label
    this.taskFactory = taskFactory
    this._exitProcess = _exitProcess
    this.initMetaModule(metaModule)
  }

  private initMetaModule(metaModule: IMetaModule<unknown>): void {
    this.initInit(metaModule)
    this.initObserveConcurrency(metaModule)
    this.initFinal(metaModule)
  }

  private initFinal(metaModule: IMetaModule<unknown>): void {
    this.final = metaModule.final
  }

  private initObserveConcurrency(metaModule: IMetaModule<unknown>): void {
    if (metaModule.observeConcurrency) {
      const subscription = metaModule.observeConcurrency().subscribe({
        next: concurrency => {
          this.setConcurrency(concurrency)
        }
      , error: err => this.error(err)
      })
      this.destructor.defer(() => subscription.unsubscribe())
    }
  }

  private initInit(metaModule: IMetaModule<unknown>): void {
    if (metaModule.init) {
      let emitted = false

      const subscription = metaModule.init().subscribe({
        next: params => {
          emitted = true
          this.params.resolve(params)
        }
      , complete: () => {
          if (!emitted) {
            this.error(new FatalError('The observable complete before any value is emitted'))
          }
        }
      , error: err => this.error(err)
      })
      this.destructor.defer(() => subscription.unsubscribe())
    } else {
      this.params.resolve(undefined)
    }
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
    const target = isString(val) ? parseConcurrency(val) : val
    if (isntNull(target)) {
      this.targetConcurrency = target
    }

    go(async () => {
      this.fsm.send('scale')
      await this.scale()
      this.fsm.send('scaled')
    })
  }

  exit(): void {
    this.fsm.send('exit')

    go(async () => {
      this.targetConcurrency = 0
      await this.scale()

      try {
        await this.final?.(Reason.Exit)
        await this.destructor.execute()
      } finally {
        this._exitProcess()
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
        await this.destructor.execute()
      } finally {
        this._exitProcess(err)
      }
    })
  }

  private crash(err: Error): void {
    this._exitProcess(err)
  }

  private async scale(): Promise<void> {
    await this.scaleLock.acquire(async () => {
      debug('scaling concurrency %d to %d', this.tasks.size, this.targetConcurrency)

      while (this.tasks.size !== this.targetConcurrency) {
        while (this.tasks.size < this.targetConcurrency) {
          await this.startTask()
          debug('current concurrency: %d', this.tasks.size)
        }

        while (this.tasks.size > this.targetConcurrency) {
          await this.stopTask()
          debug('current concurrency: %d', this.tasks.size)
        }
      }
    })
  }

  private async startTask(): Promise<void> {
    debug('starting a task')

    const task = await this.taskFactory.create()
    this.tasks.add(task)

    task.start(await this.params).catch(err => {
      if (err instanceof FatalError) {
        this.crash(err)
      }
    }).finally(async () => {
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

    const task = find(
      this.tasks
    , task => task.getStatus() === TaskStatus.Running
    )
    if (task) {
      await task.stop()
      this.tasks.delete(task)
    }
  }
}
