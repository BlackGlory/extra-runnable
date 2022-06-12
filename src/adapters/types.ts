import { Awaitable } from '@blackglory/prelude'

export type PrimitiveRunnableFunction<Result, Args extends unknown[]> =
  (signal: AbortSignal, ...args: Args) => Awaitable<Result>
