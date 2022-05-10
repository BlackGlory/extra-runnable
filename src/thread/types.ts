import { WorkerState } from '@fsm/worker.js'

export interface IAPI<Result, Args extends unknown[]> {
  getStatus(): WorkerState

  init(filename: string): Promise<void>
  run(...args: Args): Promise<Result>
  abort(): void
}
