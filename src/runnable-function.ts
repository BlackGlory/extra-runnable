import { Awaitable, pass } from '@blackglory/prelude'
import { IRunnable, IRawRunnableFunction } from './types.js'

export class RunnableFunction<Args extends unknown[], Result> implements IRunnable<Args, Result> {
  private controller?: AbortController

  constructor(
    private fn: IRawRunnableFunction<Args, Result>
  ) {}

  init(): void {
    pass()
  }

  run(...args: Args): Awaitable<Result> {
    const controller = new AbortController()
    this.controller = controller

    return this.fn(controller.signal, ...args)
  }

  abort(): void {
    if (this.controller) {
      this.controller.abort()
      this.controller = undefined
    }
  }

  destroy(): void {
    pass()
  }

  clone(): RunnableFunction<Args, Result> {
    return new RunnableFunction(this.fn)
  }
}
