import { TaskState } from '@fsm/task.js'
import { Awaitable } from '@blackglory/prelude'

export { TaskState } from '@fsm/task.js'

export interface IModule<Result, Params> {
  default(signal: AbortSignal, params?: Params): Awaitable<Result>
}

export interface ITask<Result, Params> {
  getStatus(): TaskState
  init(): Promise<void>
  run(params: Params): Promise<Result>
  abort(): Promise<void>
  destroy(): void
}
