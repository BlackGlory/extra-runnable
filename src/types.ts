import { Awaitable } from '@blackglory/prelude'

export interface IRunnable<Args extends unknown[], Result> {
  init(): Awaitable<void>
  run(...args: Args): Awaitable<Result>
  abort(): Awaitable<void>
  destroy(): Awaitable<void>
}

export type IRawRunnableFunction<Args extends unknown[], Result> = (
  signal: AbortSignal
, ...args: Args
) => Awaitable<Result>

export interface IRawRunnableModule<Args extends unknown[], Result> {
  default: IRawRunnableFunction<Args, Result>

  destroy?(): Awaitable<void>
}
