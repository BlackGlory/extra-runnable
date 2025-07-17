import { assert, isntUndefined } from '@blackglory/prelude'
import { AbortController } from 'extra-abort'
import { importConsumerModule } from '@utils/import-consumer-module.js'
import { Consumer, RunnableConsumer } from '@src/types.js'

export class RunnableConsumerFromModule<Params> implements RunnableConsumer<Params> {
  private controller?: AbortController
  private fn?: Consumer<Params>

  /**
   * @param filename export `IConsumerModule<Params>`
   */
  constructor(private filename: string) {}

  async init(): Promise<void> {
    const module = await importConsumerModule<Params>(this.filename)
    this.fn = module.default
  }

  async run(params: Params): Promise<void> {
    this.controller = new AbortController()

    assert(isntUndefined(this.fn), 'module is undefined')
    await this.fn(this.controller.signal, params)
  }

  async abort(): Promise<void> {
    assert(this.controller, 'controller is undefined')

    this.controller.abort()
  }

  destroy(): void {
    delete this.controller
  }
}
