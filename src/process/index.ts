import { createClient } from '@delight-rpc/child-process'
import { ClientProxy } from 'delight-rpc'
import { fork, ChildProcess } from 'node:child_process'
import { Deferred } from 'extra-promise'
import { ITask } from '@src/types.js'
import { IAPI } from './types.js'
import { pass, assert } from '@blackglory/prelude'
import { FiniteStateMachine } from '@blackglory/structures'
import { taskSchema, TaskState } from '@fsm/task.js'
import { waitForEventEmitter } from '@blackglory/wait-for'
import { fileURLToPath } from 'node:url'

const workerFilename = fileURLToPath(new URL('./worker.js', import.meta.url))

export class ProcessTaskFromModule<Result, Args extends unknown[]> implements ITask<Result, Args> {
  private task?: Deferred<void>
  private childProcess?: ChildProcess
  private client?: ClientProxy<IAPI<Result, Args>>
  private cancelClient?: () => void
  private fsm = new FiniteStateMachine(taskSchema, TaskState.Created)

  constructor(private filename: string) {}

  getStatus(): TaskState {
    return this.fsm.state
  }

  async init(): Promise<void> {
    this.fsm.send('init') 
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
      this.fsm.send('inited')
    } catch (e) {
      this.fsm.send('error')
      throw e
    }
  }

  async run(...args: Args): Promise<Result> {
    this.fsm.send('start')
    assert(this.client, 'client is undefined')

    this.task = new Deferred<void>()
    Promise.resolve(this.task).catch(pass)

    try {
      const promise = this.client.run(...args)
      this.fsm.send('started')
      const result = await promise

      if (this.fsm.matches(TaskState.Stopping)) {
        this.fsm.send('stopped')
      } else {
        this.fsm.send('complete')
      }
      this.task.resolve()
      return result
    } catch (e) {
      if (this.fsm.matches(TaskState.Stopping)) {
        this.fsm.send('stopped')
      } else {
        this.fsm.send('error')
      }
      this.task.reject(e)
      throw e
    }
  }

  async abort(): Promise<void> {
    this.fsm.send('stop')
    assert(this.client, 'client is undefined')

    await this.client.abort()
    await this.task
  }

  destroy(): void {
    this.fsm.send('destroy')

    this.cancelClient?.()
    this.childProcess?.kill('SIGKILL')

    delete this.cancelClient
    delete this.childProcess
    delete this.client
    delete this.task
  }
}
