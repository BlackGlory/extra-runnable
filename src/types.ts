import { TaskState } from '@fsm/task.js'
import { Awaitable } from '@blackglory/prelude'

export { TaskState } from '@fsm/task.js'

export type TaskFunction<Result, Args extends unknown[]> =
  (signal: AbortSignal, ...args: Args) => Awaitable<Result>

export interface ITask<Result, Args extends unknown[]> {
  getStatus(): TaskState

  init(): Promise<void>
  run(...args: Args): Promise<Result>
  abort(): Promise<void>
  destroy(): void
}
