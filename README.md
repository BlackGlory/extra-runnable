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
  Created = 'created' // => Initializing
, Initializing = 'initializing' // => Ready or Crashed
, Crashed = 'crashed' // => Initializing
, Ready = 'ready' // => Starting or Destroyed
, Starting = 'starting' // => Running or Error
, Running = 'running' // => Stopping or Completed or Error
, Stopping = 'stopping' // => Stopped
, Stopped = 'stopped' // => Destroyed or Starting
, Completed = 'completed' // => Destroyed or Starting
, Error = 'error' // => Destroyed or Starting
, Destroyed = 'destroyed'
}

class Task<Result, Args extends unknown[]> {
  constructor(adapter: IAdapter<Result, Args>)

  getState(): TaskState
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
```

#### AsyncAdapter
```ts
type TaskFunction<Result, Args extends unknown[]> =
  (signal: AbortSignal, ...args: Args) => Awaitable<Result>

class AsyncAdapter<Result, Args extends unknown[]> implements IAdapter<Result, Args> {
  constructor(taskFunction: TaskFunction<Result, Args>)
}
```
