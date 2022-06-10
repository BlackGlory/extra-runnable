import { IAdapter } from '@src/types.js'
import { assert, pass, isntUndefined, Awaitable } from '@blackglory/prelude'
import { AbortController } from 'extra-abort'

export type RunnableFunction<Result, Args extends unknown[]> =
  (signal: AbortSignal, ...args: Args) => Awaitable<Result>

export class AsyncAdapter<Result, Args extends unknown[]> implements IAdapter<Result, Args> {
  private controller?: AbortController

  constructor(private fn: RunnableFunction<Result, Args>) {}

  init(): void {
    pass()
  }

  async run(...args: Args): Promise<Result> {
    const controller = new AbortController()
    this.controller = controller

    assert(isntUndefined(this.fn), 'module is undefined')
    return await this.fn(controller.signal, ...args)
  }

  abort(): void {
    assert(this.controller, 'controller is undefined')

    this.controller.abort()
  }

  destroy(): void {
    delete this.controller
  }
}
