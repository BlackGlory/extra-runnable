# Boso
## Install
```sh
npm install --save boso
# or
yarn add boso
```

## API
```ts
// export default function (signal: AbortSignal, ...args: Args) {...}
type TaskFunction<Result, Args extends unknown[]> =
  (signal: AbortSignal, ...args: Args) => Awaitable<Result>

interface ITask<Result, Args extends unknown[]> {
  getStatus(): TaskState

  init(): Promise<void>
  run(...args: Args): Promise<Result>
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
class AsyncTaskFromModule<Result, Args extends unknown[]> implements ITask<Result, Args> {
  constructor(filename: string)
}

class AsyncTaskFromFunction<Result, Args extends unknown[]> extends AsyncTask<Result, Args> {
  constructor(taskFunction: TaskFunction<Result, Args>)
}
```

### ProcessTask
```ts
class ProcessTaskFromModule<Result, Args extends unknown[]> implements ITask<Result, Args> {
  constructor(filename: string)
}
```

### ThreadTask
```ts
class ThreadTaskFromModule<Result, Args extends unknown[]> implements ITask<Result, Args> {
  constructor(filename: string)
}
```
