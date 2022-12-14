import { Awaitable } from '@blackglory/prelude'

export type RawRunnableFunction<Result, Args extends unknown[]> =
  (signal: AbortSignal, ...args: Args) => Awaitable<Result>
