import { WorkerState } from './fsm.js'

export interface IAPI<Params> {
  getState(): WorkerState

  init(filename: string): Promise<void>
  run(params: Params): Promise<void>
  abort(): void
}
