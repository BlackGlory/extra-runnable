import { createClient } from '@delight-rpc/worker-threads'
import { ClientProxy } from 'delight-rpc'
import { Worker } from 'node:worker_threads'
import { IAPI } from './types.js'
import { assert } from '@blackglory/prelude'
import { fileURLToPath } from 'node:url'
import { IRunnable } from '@src/types.js'

const workerFilename = fileURLToPath(new URL('./worker.js', import.meta.url))

export class RunnableModuleAsThread<Result, Args extends unknown[]> implements IRunnable<Result, Args> {
  private worker?: Worker
  private client?: ClientProxy<IAPI<Result, Args>>
  private cancelClient?: () => void

  /**
   * @param filename export default as `PrimitiveRunnableFunction`
   */
  constructor(private filename: string) {}

  async init(): Promise<void> {
    try {
      this.worker = new Worker(workerFilename)
      ;[this.client, this.cancelClient] = createClient<IAPI<Result, Args>>(this.worker)
      await this.client.init(this.filename)
    } catch (e) {
      this.destroy()
      throw e
    }
  }

  async run(...args: Args): Promise<Result> {
    assert(this.client, 'client is undefined')

    return await this.client.run(...args)
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
