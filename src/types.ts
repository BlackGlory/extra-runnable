import { Observable } from 'rxjs'
import { CustomError } from '@blackglory/errors'

export class FatalError extends CustomError {
  constructor(message?: unknown) {
    super(message ? `${message}` : undefined)
  }
}

export enum Mode {
  Async = 'async'
, Thread = 'thread'
, Process = 'process'
}

export enum DaemonStatus {
  Idle = 'idle'
, Running = 'running'

  /**
   * 隐式带有Running的语义
   */
, Scaling = 'scaling'

  /**
   * 隐式带有Scaling的语义, 但不带有Running的语义
   */
, Exiting = 'exiting'
}

export enum TaskStatus {
  Ready = 'ready'
, Starting = 'starting'
, Running = 'running'
, Stopping = 'stopping'
, Stopped = 'stopped'
, Completed = 'completed'
, Error = 'error'
}

export enum Reason {
  Exit = 'exit'
, Error = 'error'
}

export interface IMetaModule<T> {
  init?: () => Observable<T>
  observeConcurrency?: () => Observable<number>
  final?: (reason: Reason, error?: Error) => void | PromiseLike<void>
}

export interface ITaskModule<T> {
  default(signal: AbortSignal, params?: T): void | PromiseLike<void>
}

export interface ITask<T> {
  getStatus(): TaskStatus

  /**
   * 返回一个Promise, 当任务终止运行时该Promise会达到resolved, 如果任务抛出错误, 则会达到rejected.
   * 
   * @throws {FatalError} 
   */
  start(params: T): Promise<void>

  /**
   * 返回一个Promise, 当任务终止运行时该Promise会达到resolved, 任务终止过程中抛出异常会达到rejected,
   * 但无论如何都会以Stopped状态结束.
   */
  stop(): Promise<void>
}

export interface ITaskFactory<T> {
  readonly mode: Mode
  readonly filename: string

  create(): ITask<T> | Promise<ITask<T>>
}

export interface IAPI {
  ping(): 'pong'

  getInfo(): {
    id: string
    label: string
    mode: Mode
  }

  getStatus(): DaemonStatus

  getConcurrency(): {
    current: number
    target: number
  }
  setConcurrency(val: number | string): void

  exit(): void
}
