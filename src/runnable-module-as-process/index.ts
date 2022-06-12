import { createClient } from '@delight-rpc/child-process'
import { ClientProxy } from 'delight-rpc'
import { fork, ChildProcess } from 'node:child_process'
import { IAPI } from './types.js'
import { assert } from '@blackglory/prelude'
import { waitForEventEmitter } from '@blackglory/wait-for'
import { fileURLToPath } from 'node:url'
import { IRunnable } from '@src/types.js'

const workerFilename = fileURLToPath(new URL('./worker.js', import.meta.url))

export class RunnableModuleAsProcess<Result, Args extends unknown[]> implements IRunnable<Result, Args> {
  private childProcess?: ChildProcess
  private client?: ClientProxy<IAPI<Result, Args>>
  private cancelClient?: () => void

  constructor(private filename: string) {}

  async init(): Promise<void> {
    try {
      this.childProcess = fork(workerFilename, { serialization: 'advanced' })
      // 在使用ES模块时, 子进程的message事件不会在注册listener前阻塞.
      // 为解决此问题, 需要等子进程先通知自己已经准备好.
      // 该问题可能在v17.4.0里得到解决, 在项目的最低版本升级到v18时, 可以试试取消相关代码.
      // - https://github.com/nodejs/node/issues/34785
      // - https://github.com/nodejs/node/pull/41221
      await waitForEventEmitter(this.childProcess, 'message')
      ;[this.client, this.cancelClient] = createClient<IAPI<Result, Args>>(this.childProcess)
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
    this.childProcess?.kill('SIGKILL')

    delete this.cancelClient
    delete this.childProcess
    delete this.client
  }
}
