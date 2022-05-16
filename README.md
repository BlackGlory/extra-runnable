# Boso
The encapsulated task class.

## Install
```sh
npm install --save boso
# or
yarn add boso
```

## API
### Task
```ts
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

class Task<Result, Args extends unknown[]> {
  constructor(adapter: IAdapter<Result, Args>)

  getStatus(): TaskState
  async init(): Promise<void>
  async run(...args: Args): Promise<Result>
  async abort(): Promise<void>
  async destroy(): Promise<void>
}

```

### Adapter
```ts
interface IAdapter<Result, Args extends unknown[]> {
  init(): Awaitable<void>
  run(...args: Args): Awaitable<Result>
  abort(): Awaitable<void>
  destroy(): Awaitable<void>
}

// export default function (signal: AbortSignal, ...args: Args) {...}
type TaskFunction<Result, Args extends unknown[]> =
  (signal: AbortSignal, ...args: Args) => Awaitable<Result>
```

#### AsyncAdapter
```ts
class AsyncModuleAdapter<Result, Args extends unknown[]> implements IAdapter<Result, Args> {
  constructor(filename: string)
}

class AsyncFunctionAdapter<Result, Args extends unknown[]> implements <Result, Args> {
  constructor(taskFunction: TaskFunction<Result, Args>)
}
```

#### ProcessAdapter
```ts
class ProcessAdapter<Result, Args extends unknown[]> implements IAdapter<Result, Args> {
  constructor(filename: string)
}
```

#### ThreadAdapter
```ts
class ThreadAdapter<Result, Args extends unknown[]> implements IAdapter<Result, Args> {
  constructor(filename: string)
}
```
