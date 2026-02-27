# extra-runnable
The Runnable and Runner in JavaScript/Typescript.

## Install
```sh
npm install --save extra-runnable
# or
yarn add extra-runnable
```

## API
```ts
interface IRunnable<Args extends unknown[], Result> {
  init(): Awaitable<void>
  run(...args: Args): Awaitable<Result>
  abort(): Awaitable<void>
  destroy(): Awaitable<void>
}

type IRawRunnableFunction<Args extends unknown[], Result> = (
  signal: AbortSignal
, ...args: Args
) => Awaitable<Result>

interface IRawRunnableModule<Args extends unknown[], Result> {
  default: IRawRunnableFunction<Args, Result>

  destroy?(): Awaitable<void>
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

### Runnables
All runnables do not support concurrent running,
their behavior during concurrent running is unpredictable.

#### RunnableFunction
```ts
class RunnableFunction<Args extends unknown[], Result> implements IRunnable<Args, Result> {
  constructor(fn: IRawRunnableFunction<Args, Result>)

  init(): void
  run(...args: Args): Promise<Result>
  abort(): void
  destroy(): void

  clone(): RunnableFunction<Args, Result>
}
```

#### RunnableModule
```ts
class RunnableModule<Args extends unknown[], Result> implements IRunnable<Args, Result> {
  /**
   * @param filename The file should be a module that exports `IRawRunnableModule<Args, Result>`
   */
  constructor(filename: string)

  init(): Promise<void>
  run(...args: Args): Promise<Result>
  abort(): void
  destroy(): void

  clone(): RunnableModule<Args, Result>
}
```

#### RunnableThread
```ts
class RunnableThread<Args extends unknown[], Result> implements IRunnable<Args, Result> {
  /**
   * @param filename The file should be a module that exports `IRawRunnableModule<Args, Result>`
   */
  constructor(filename: string)

  init(): Promise<void>
  run(...args: Args): Promise<Result>
  abort(): Promise<void>
  destroy(): Promise<void>

  clone(): RunnableThread<Args, Result>
}
```

#### RunnableProcess
```ts
class RunnableProcess<Args extends unknown[], Result> implements IRunnable<Args, Result> {
  /**
   * @param filename The file should be a module that exports `IRawRunnableModule<Args, Result>`
   */
  constructor(filename: string)

  init(): Promise<void>
  run(...args: Args): Promise<Result>
  abort(): Promise<void>
  destroy(): Promise<void>

  clone(): RunnableProcess<Args, Result>
}
```
