import { IFiniteStateMachineSchema } from '@blackglory/structures'
import { TaskStatus } from '@src/types.js'

type Event = 'start' | 'started' | 'stop' | 'stopped' | 'complete' | 'error'

export const schema: IFiniteStateMachineSchema<TaskStatus, Event> = {
  [TaskStatus.Ready]: {
    start: TaskStatus.Starting
  }
, [TaskStatus.Starting]: {
    started: TaskStatus.Running
  , error: TaskStatus.Error
  }
, [TaskStatus.Running]: {
    stop: TaskStatus.Stopping
  , complete: TaskStatus.Completed
  , error: TaskStatus.Error
  }
, [TaskStatus.Stopping]: {
    stopped: TaskStatus.Stopped
  }
, [TaskStatus.Stopped]: {}
, [TaskStatus.Completed]: {}
, [TaskStatus.Error]: {}
}
