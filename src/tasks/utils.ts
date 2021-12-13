import { IFiniteStateMachineSchema } from '@blackglory/structures'
import { TaskStatus } from '@src/types'

type Event = 'run' | 'stopBegin' | 'stopEnd' | 'complete' | 'error'

export const schema: IFiniteStateMachineSchema<TaskStatus, Event> = {
  [TaskStatus.Ready]: {
    run: TaskStatus.Running
  }
, running: {
    stopBegin: TaskStatus.Stopping
  , complete: TaskStatus.Completed
  , error: TaskStatus.Error
  }
, stopping: {
    stopEnd: TaskStatus.Stopped
  }
, stopped: {}
, completed: {}
, error: {}
}
