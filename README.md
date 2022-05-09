# Boso
## Install
```sh
npm install --save boso
# or
yarn add boso
```

## API
```ts
// export default function (signal: AbortSignal, params?: Params) {...}
type TaskFunction<Result, Params> = (signal: AbortSignal, params?: Params) =>
  Awaitable<Result>

interface ITask<Result, Params> {
  getStatus(): TaskState

  init(): Promise<void>
  run(params: Params): Promise<Result>
  abort(): Promise<void>
  destroy(): void
}

enum TaskState {
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
```

### AsyncTask
```ts
class AsyncTask<Result, Params> implements ITask<Result, Params> {
  constructor(filename: string)
}
```

### ProcessTask
```ts
class ProcessTask<Result, Params> implements ITask<Result, Params> {
  constructor(filename: string)
}
```

### ThreadTask
```ts
class ThreadTask<Result, Params> implements ITask<Result, Params> {
  constructor(filename: string)
}
```
