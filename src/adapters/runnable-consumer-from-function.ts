import { Consumer, RunnableConsumer } from '@src/types.js'
import { assert, pass, isntUndefined } from '@blackglory/prelude'
import { AbortController } from 'extra-abort'

export class RunnableConsumerFromFunction<Params> implements RunnableConsumer<Params> {
  private controller?: AbortController

  constructor(private fn: Consumer<Params>) {}

  init(): void {
    pass()
  }

  async run(params: Params): Promise<void> {
    const controller = new AbortController()
    this.controller = controller

    assert(isntUndefined(this.fn), 'module is undefined')
    return await this.fn(controller.signal, params)
  }

  abort(): void {
    assert(this.controller, 'controller is undefined')

    this.controller.abort()
  }

  destroy(): void {
    delete this.controller
  }
}
