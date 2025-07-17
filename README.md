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
interface IRunnable<Args extends unknown[], Result> {
  init(): Awaitable<void>
  run(...args: Args): Awaitable<Result>
  abort(): Awaitable<void>
  destroy(): Awaitable<void>
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

class Runner<Args extends unknown[], Result> {
  constructor(runnable: IRunnable<Result, Args>)

  getState(): RunnableState

  init(): Promise<void>
  run(...args: Args): Promise<Result>
  abort(): Promise<void>
  destroy(): Promise<void>
}
```
