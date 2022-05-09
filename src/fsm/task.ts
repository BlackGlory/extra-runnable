import { IFiniteStateMachineSchema } from '@blackglory/structures'

export enum TaskState {
  Created = 'created'
, Initializing = 'initializing'
, Ready = 'ready'
, Starting = 'starting'
, Running = 'running'
, Stopping = 'stopping'
, Stopped = 'stopped'
, Completed = 'completed'
, Error = 'error'
, Destroyed = 'destroyed'
}

type TaskEvent =
| 'init'
| 'inited'
| 'start'
| 'started'
| 'stop'
| 'stopped'
| 'complete'
| 'error'
| 'destroy'

export const taskSchema: IFiniteStateMachineSchema<TaskState, TaskEvent> = {
  [TaskState.Created]: {
    init: TaskState.Initializing
  }
, [TaskState.Initializing]: {
    inited: TaskState.Ready
  , error: TaskState.Error
  }
, [TaskState.Ready]: {
    start: TaskState.Starting
  , destroy: TaskState.Destroyed
  }
, [TaskState.Starting]: {
    started: TaskState.Running
  , error: TaskState.Error
  }
, [TaskState.Running]: {
    stop: TaskState.Stopping
  , complete: TaskState.Completed
  , error: TaskState.Error
  }
, [TaskState.Stopping]: {
    stopped: TaskState.Stopped
  }
, [TaskState.Stopped]: {
    destroy: TaskState.Destroyed
  }
, [TaskState.Completed]: {
    destroy: TaskState.Destroyed
  }
, [TaskState.Error]: {
    destroy: TaskState.Destroyed
  }
, [TaskState.Destroyed]: {}
}
