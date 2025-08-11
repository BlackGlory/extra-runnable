import { createClient } from '@delight-rpc/worker-threads'
import { ClientProxy } from 'delight-rpc'
import { Worker } from 'worker_threads'
import { assert } from '@blackglory/prelude'
import { fileURLToPath } from 'url'
import { IRunnable } from '@src/types.js'
import { IAPI } from './types.js'

const workerFilename = fileURLToPath(new URL('./worker.js', import.meta.url))

export class RunnableThread<Args extends unknown[], Result> implements IRunnable<Args, Result> {
  private worker?: Worker
  private client?: ClientProxy<IAPI<Args, Result>>
  private cancelClient?: () => void

  /**
   * @param filename The file should be a module that exports `IRawRunnableModule<Args, Result>`
   */
  constructor(private filename: string) {}

  async init(): Promise<void> {
    try {
      this.worker = new Worker(workerFilename)
      ;[this.client, this.cancelClient] = createClient<IAPI<Args, Result>>(
        this.worker
      )
      await this.client.init(this.filename)
    } catch (e) {
      await this.destroy()

      throw e
    }
  }

  async run(...args: Args): Promise<Result> {
    assert(this.client, 'client is undefined')

    return await this.client.run(args)
  }

  async abort(): Promise<void> {
    assert(this.client, 'client is undefined')

    await this.client.abort()
  }

  async destroy(): Promise<void> {
    this.cancelClient?.()
    await this.worker?.terminate()

    this.cancelClient = undefined
    this.worker = undefined
    this.client = undefined
  }

  clone(): RunnableThread<Args, Result> {
    return new RunnableThread(this.filename)
  }
}
