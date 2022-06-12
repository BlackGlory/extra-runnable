import { assert, isntUndefined } from '@blackglory/prelude'
import { AbortController } from 'extra-abort'
import { importModule } from '@adapters/utils.js'
import { IRunnable } from '@src/types.js'
import { PrimitiveRunnableFunction } from '@adapters/types.js'

export class RunnableModule<Result, Args extends unknown[]> implements IRunnable<Result, Args> {
  private controller?: AbortController
  private fn?: PrimitiveRunnableFunction<Result, Args>

  /**
   * @param filename export default as `PrimitiveRunnableFunction`
   */
  constructor(private filename: string) {}

  async init(): Promise<void> {
    this.fn = await importModule(this.filename)
  }

  async run(...args: Args): Promise<Result> {
    this.controller = new AbortController()

    assert(isntUndefined(this.fn), 'module is undefined')
    return await this.fn(this.controller.signal, ...args)
  }

  abort(): void {
    assert(this.controller, 'controller is undefined')

    this.controller.abort()
  }

  destroy(): void {
    delete this.controller
  }
}
