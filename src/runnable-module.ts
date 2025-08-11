import { assert, isntUndefined } from '@blackglory/prelude'
import { importRawRunnableModule } from '@utils/import-raw-runnable-module.js'
import { IRunnable, IRawRunnableModule } from './types.js'

export class RunnableModule<Args extends unknown[], Result> implements IRunnable<Args, Result> {
  private controller?: AbortController
  private module?: IRawRunnableModule<Args, Result>

  /**
   * @param filename The file should be a module that exports `IRawRunnableModule<Args, Result>`
   */
  constructor(private filename: string) {}

  async init(): Promise<void> {
    this.module = await importRawRunnableModule<Args, Result>(this.filename)
  }

  async run(...args: Args): Promise<Result> {
    assert(isntUndefined(this.module), 'module is undefined')

    const controller = new AbortController()
    this.controller = controller

    return await this.module.default(controller.signal, ...args)
  }

  abort(): void {
    if (this.controller) {
      this.controller.abort()
      this.controller = undefined
    }
  }

  destroy(): void {
    this.module?.destroy?.()

    this.controller = undefined
    this.module = undefined
  }

  clone(): RunnableModule<Args, Result> {
    return new RunnableModule(this.filename)
  }
}
