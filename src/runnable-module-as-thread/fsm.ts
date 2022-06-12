import { IFiniteStateMachineSchema } from '@blackglory/structures'

export enum WorkerState {
  Idle = 'idle'
, Starting = 'starting'
, Running = 'running'
, Aborting = 'aborting'
}

type WorkerEvent =
| 'start'
| 'started'
| 'abort'
| 'end'

export const workerSchema: IFiniteStateMachineSchema<WorkerState, WorkerEvent> = {
  [WorkerState.Idle]: {
    start: WorkerState.Starting
  }
, [WorkerState.Starting]: {
    started: WorkerState.Running
  , abort: WorkerState.Aborting
  }
, [WorkerState.Running]: {
    abort: WorkerState.Aborting
  , end: WorkerState.Idle 
  }
, [WorkerState.Aborting]: {
    end: WorkerState.Idle 
  }
}
