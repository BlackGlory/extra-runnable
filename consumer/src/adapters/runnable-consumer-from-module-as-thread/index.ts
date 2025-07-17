import { createClient } from '@delight-rpc/worker-threads'
import { ClientProxy } from 'delight-rpc'
import { Worker } from 'node:worker_threads'
import { IAPI } from './types.js'
import { assert } from '@blackglory/prelude'
import { fileURLToPath } from 'node:url'
import { RunnableConsumer } from '@src/types.js'

const workerFilename = fileURLToPath(new URL('./worker.js', import.meta.url))

export class RunnableConsumerFromModuleAsThread<Params> implements RunnableConsumer<Params> {
  private worker?: Worker
  private client?: ClientProxy<IAPI<Params>>
  private cancelClient?: () => void

  /**
   * @param filename export `IConsumerModule<Params>`
   */
  constructor(private filename: string) {}

  async init(): Promise<void> {
    try {
      this.worker = new Worker(workerFilename)
      ;[this.client, this.cancelClient] = createClient<IAPI<Params>>(this.worker)
      await this.client.init(this.filename)
    } catch (e) {
      this.destroy()
      throw e
    }
  }

  async run(params: Params): Promise<void> {
    assert(this.client, 'client is undefined')

    await this.client.run(params)
  }

  async abort(): Promise<void> {
    assert(this.client, 'client is undefined')

    await this.client.abort()
  }

  destroy(): void {
    this.cancelClient?.()
    this.worker?.terminate()

    delete this.cancelClient
    delete this.worker
    delete this.client
  }
}
