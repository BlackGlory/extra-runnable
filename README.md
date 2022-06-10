# extra-runnable
The Runnable in JavaScript/Typescript.

## Install
```sh
npm install --save extra-runnable
# or
yarn add extra-runnable
```

## API
### Runnable
```ts
enum RunnableState {
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

class Runnable<Result, Args extends unknown[]> {
  constructor(adapter: IAdapter<Result, Args>)

  getState(): RunnableState
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
type RunnableFunction<Result, Args extends unknown[]> =
  (signal: AbortSignal, ...args: Args) => Awaitable<Result>

class AsyncAdapter<Result, Args extends unknown[]> implements IAdapter<Result, Args> {
  constructor(fn: RunnableFunction<Result, Args>)
}
```
