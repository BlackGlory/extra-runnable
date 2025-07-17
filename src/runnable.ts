import { Awaitable } from '@blackglory/prelude'

export interface IRunnable<Args extends unknown[], Result> {
  init(): Awaitable<void>
  run(...args: Args): Awaitable<Result>
  abort(): Awaitable<void>
  destroy(): Awaitable<void>
}
