# extra-runnable
The Runnable and Runner in JavaScript/Typescript.

## Install
```sh
npm install --save extra-runnable
# or
yarn add extra-runnable
```

## API
### IRunnable
```ts
interface IRunnable<Result, Args extends unknown[]> {
  init(): Awaitable<void>
  run(...args: Args): Awaitable<Result>
  abort(): Awaitable<void>
  destroy(): Awaitable<void>
}
```

#### RunnableFunction
```ts
class RunnbleFunction<Result, Args extends unknown[]> implements IRunnable<Result, Args> {
  constructor(fn: (signal: AbortSignal, ...args: Args) => Awaitable<Result>)
}
```

### Runner
```ts
enum RunnerState {
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

class Runner<Result, Args extends unknown[]> {
  constructor(runnable: IRunnable<Result, Args>)

  getState(): RunnableState
  async init(): Promise<void>
  async run(...args: Args): Promise<Result>
  async abort(): Promise<void>
  async destroy(): Promise<void>
}
```
