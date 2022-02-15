import { createClient } from '@delight-rpc/child-process'
import { ClientProxy } from 'delight-rpc'
import { fork, ChildProcess } from 'child_process'
import { Deferred } from 'extra-promise'
import { ITaskFactory, Mode, ITask, TaskStatus } from '@src/types.js'
import { IAPI } from './types.js'
import { pass } from '@blackglory/pass'
import { FiniteStateMachine } from '@blackglory/structures'
import { schema } from '@tasks/utils.js'
import { fileURLToPath } from 'node:url'
import { waitForEventEmitter } from '@blackglory/wait-for'

const workerFilename = fileURLToPath(new URL('./worker.js', import.meta.url))

class ProcessTask<T> implements ITask<T> {
  private task?: Deferred<void>
  private childProcess?: ChildProcess
  private client?: ClientProxy<IAPI>
  private cancelClient?: () => void
  private fsm = new FiniteStateMachine(schema, TaskStatus.Ready)

  constructor(private filename: string) {}

  getStatus() {
    return this.fsm.state
  }

  async start(params: T): Promise<void> {
    this.fsm.send('start')

    this.childProcess = fork(workerFilename, { serialization: 'advanced' })
    // 在使用ES模块时, 子进程的message事件不会在注册listener前阻塞.
    // 为解决此问题, 需要等子进程先通知自己已经准备好.
    // 该问题可能在v17.4.0里得到解决, 在项目的最低版本升级到v18时, 可以试试取消相关代码.
    // - https://github.com/nodejs/node/issues/34785
    // - https://github.com/nodejs/node/pull/41221
    await waitForEventEmitter(this.childProcess, 'message')
    ;[this.client, this.cancelClient] = createClient<IAPI>(this.childProcess)

    this.task = new Deferred<void>()
    Promise.resolve(this.task).catch(pass)

    try {
      const promise = this.client?.run(this.filename, params)
      this.fsm.send('started')
      await promise

      if (this.fsm.matches(TaskStatus.Stopping)) {
        this.fsm.send('stopped')
      } else {
        this.fsm.send('complete')
      }
      this.task?.resolve()
    } catch (e) {
      if (this.fsm.matches(TaskStatus.Stopping)) {
        this.fsm.send('stopped')
      } else {
        this.fsm.send('error')
      }
      this.task?.reject(e)
      throw e
    } finally {
      this.destroy()
    }
  }

  async stop(): Promise<void> {
    this.fsm.send('stop')

    await this.client!.abort()
    await this.task
  }

  destroy() {
    this.cancelClient?.()
    this.childProcess?.kill('SIGKILL')

    delete this.cancelClient
    delete this.childProcess
    delete this.client
    delete this.task
  }
}

export class ProcessTaskFactory<T> implements ITaskFactory<T> {
  readonly mode = Mode.Process

  constructor(public filename: string) {}

  create(): ProcessTask<T> {
    return new ProcessTask(this.filename)
  }
}
