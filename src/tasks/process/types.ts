import { IFiniteStateMachineSchema } from '@blackglory/structures'

export enum WorkerStatus {
  Idle = 'idle'
, Running = 'running'
, Aborting = 'aborting'
}

type Event = 'run' | 'abort' | 'end'

export const schema: IFiniteStateMachineSchema<WorkerStatus, Event> = {
  [WorkerStatus.Idle]: {
    run: WorkerStatus.Running
  }
, [WorkerStatus.Running]: {
    abort: WorkerStatus.Aborting
  , end: WorkerStatus.Idle 
  }
, [WorkerStatus.Aborting]: {
    end: WorkerStatus.Idle 
  }
}

export interface IAPI {
  run(filename: string, params: unknown): Promise<void>
  getStatus(): WorkerStatus
  abort(): void
}
