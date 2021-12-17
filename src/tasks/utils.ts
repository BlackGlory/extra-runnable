import { IFiniteStateMachineSchema } from '@blackglory/structures'
import { TaskStatus } from '@src/types'

type Event = 'run' | 'stopBegin' | 'stopEnd' | 'complete' | 'error'

export const schema: IFiniteStateMachineSchema<TaskStatus, Event> = {
  [TaskStatus.Ready]: {
    run: TaskStatus.Running
  }
, [TaskStatus.Running]: {
    stopBegin: TaskStatus.Stopping
  , complete: TaskStatus.Completed
  , error: TaskStatus.Error
  }
, [TaskStatus.Stopping]: {
    stopEnd: TaskStatus.Stopped
  }
, [TaskStatus.Stopped]: {}
, [TaskStatus.Completed]: {}
, [TaskStatus.Error]: {}
}
