export enum WorkerStatus {
  Idle = 'idle'
, Running = 'running'
, Aborting = 'aborting'
}

export interface IAPI {
  run(filename: string, params: unknown): Promise<void>
  getStatus(): WorkerStatus
  abort(): void
}
