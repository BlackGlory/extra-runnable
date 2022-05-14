import { createClient } from '@delight-rpc/worker-threads'
import { ClientProxy } from 'delight-rpc'
import { Worker } from 'node:worker_threads'
import { IAdapter } from '@src/types.js'
import { IAPI } from './types.js'
import { assert } from '@blackglory/prelude'
import { fileURLToPath } from 'node:url'

const workerFilename = fileURLToPath(new URL('./worker.js', import.meta.url))

export class ThreadAdapter<Result, Args extends unknown[]> implements IAdapter<Result, Args> {
  private worker?: Worker
  private client?: ClientProxy<IAPI<Result, Args>>
  private cancelClient?: () => void

  constructor(private filename: string) {}

  async init(): Promise<void> {
    this.worker = new Worker(workerFilename)
    ;[this.client, this.cancelClient] = createClient<IAPI<Result, Args>>(this.worker)
    await this.client.init(this.filename)
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
