import { WorkerState } from '@fsm/worker.js'

export interface IAPI<Result, Params> {
  init(filename: string): Promise<void>
  run(params: Params): Promise<Result>
  getStatus(): WorkerState
  abort(): void
}
