import { Orchestrator, OrchestratorState } from '@orchestrator/index.js'
import { IAPI } from '@src/types.js'
import { ImplementationOf } from 'delight-rpc'

export class Service<Params> implements ImplementationOf<IAPI> {
  constructor(
    private orchestrator: Orchestrator<Params>
  , private options: {
      id: string
      label: string
    }
  ) {}

  getId(): string {
    return this.options.id
  }

  getLabel(): string {
    return this.options.label
  }

  setLabel(val: string): null {
    this.options.label = val
    return null
  }

  getState(): OrchestratorState {
    return this.orchestrator.getState()
  }

  getConcurrency(): number {
    return this.orchestrator.getNumberOfInstances()
  }

  async scale(concurrency: number | string): Promise<null> {
    await this.orchestrator.scale(concurrency)
    return null
  }

  async terminate(): Promise<null> {
    await this.orchestrator.terminate()
    return null
  }
}
