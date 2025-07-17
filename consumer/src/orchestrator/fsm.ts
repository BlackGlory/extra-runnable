import { IFiniteStateMachineSchema } from 'extra-fsm'

export enum OrchestratorState {
  Running = 'running'
, Scaling = 'scaling'
, Terminating = 'terminating'
, Terminated = 'terminated'
}

type Event =
| 'scale'
| 'scaled'
| 'terminate'
| 'terminated'

export const schema: IFiniteStateMachineSchema<OrchestratorState, Event> = {
  [OrchestratorState.Running]: {
    scale: OrchestratorState.Scaling
  , terminate: OrchestratorState.Terminating
  }
, [OrchestratorState.Scaling]: {
    scaled: OrchestratorState.Running
  , terminate: OrchestratorState.Terminating
  }
, [OrchestratorState.Terminating]: {
    terminated: OrchestratorState.Terminated
  }
, [OrchestratorState.Terminated]: {}
}
