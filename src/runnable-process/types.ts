import { Awaitable } from '@blackglory/prelude'

export interface IAPI<Args, Result> {
  init(filename: string): Awaitable<void>
  run(args: Args): Awaitable<Result>
  abort(): Awaitable<void>
}
