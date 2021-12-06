import { createClient } from '@delight-rpc/child-process'
import { ClientProxy } from 'delight-rpc'
import { fork, ChildProcess } from 'child_process'
import { assert } from '@blackglory/errors'
import { Deferred } from 'extra-promise'
import { ITaskFactory, Mode, ITask, TaskStatus } from '@src/types'
import { IAPI } from './types'
import * as path from 'path'
import { pass } from '@blackglory/pass'
import { go } from '@blackglory/go'

const workerFilename = path.resolve(__dirname, './worker.js')

class ProcessTask<T> implements ITask<T> {
  private status = TaskStatus.Ready
  private task?: Deferred<void>
  private childProcess?: ChildProcess
  private client?: ClientProxy<IAPI>
  private cancelClient?: () => void

  constructor(private filename: string) {}

  getStatus() {
    return this.status
  }

  private setStatus(status: TaskStatus): void {
    this.status = status
  }

  async start(params: T): Promise<void> {
    assert(
      this.status === TaskStatus.Ready ||
      this.status === TaskStatus.Stopped ||
      this.status === TaskStatus.Completed ||
      this.status === TaskStatus.Error
    )
    this.setStatus(TaskStatus.Running)

    this.childProcess = fork(workerFilename, { serialization: 'advanced' })
    ;[this.client, this.cancelClient] = createClient<IAPI>(this.childProcess)

    this.task = new Deferred<void>()
    Promise.resolve(this.task).catch(pass)

    await go(async () => {
      try {
        await this.client?.run(this.filename, params)

        if (this.status === TaskStatus.Stopping) {
          this.setStatus(TaskStatus.Stopped)
        } else {
          this.setStatus(TaskStatus.Completed)
        }
        this.task?.resolve()
      } catch (e) {
        if (this.status === TaskStatus.Stopping) {
          this.setStatus(TaskStatus.Stopped)
        } else {
          this.setStatus(TaskStatus.Error)
        }
        this.task?.reject(e)
        throw e
      } finally {
        this.destroy()
      }
    })
  }

  async stop(): Promise<void> {
    assert(this.status === TaskStatus.Running)
    this.setStatus(TaskStatus.Stopping)

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
