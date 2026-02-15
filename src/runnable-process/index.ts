import { assert } from '@blackglory/prelude'
import { createClient } from '@delight-rpc/child-process'
import { ClientProxy } from 'delight-rpc'
import { fork, ChildProcess } from 'child_process'
import { fileURLToPath } from 'url'
import { IRunnable } from '@src/types.js'
import { IAPI } from './types.js'

const workerFilename = fileURLToPath(new URL('./worker.js', import.meta.url))

export class RunnableProcess<Args extends unknown[], Result> implements IRunnable<Args, Result> {
  private childProcess?: ChildProcess
  private client?: ClientProxy<IAPI<Args, Result>>
  private cancelClient?: () => void

  /**
   * @param filename The file should be a module that exports `IRawRunnableModule<Args, Result>`
   */
  constructor(private filename: string) {}

  async init(): Promise<void> {
    try {
      this.childProcess = fork(workerFilename, { serialization: 'advanced' })
      ;[this.client, this.cancelClient] = createClient<IAPI<Args, Result>>(
        this.childProcess
      )
      await this.client.init(this.filename)
    } catch (e) {
      this.destroy()

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
    await this.client?.destroy()

    this.cancelClient?.()
    this.childProcess?.kill('SIGKILL')

    this.cancelClient = undefined
    this.childProcess = undefined
    this.client = undefined
  }

  clone(): RunnableProcess<Args, Result> {
    return new RunnableProcess(this.filename)
  }
}
