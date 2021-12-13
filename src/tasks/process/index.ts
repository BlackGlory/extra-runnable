import { createClient } from '@delight-rpc/child-process'
import { ClientProxy } from 'delight-rpc'
import { fork, ChildProcess } from 'child_process'
import { Deferred } from 'extra-promise'
import { ITaskFactory, Mode, ITask, TaskStatus } from '@src/types'
import { IAPI } from './types'
import * as path from 'path'
import { pass } from '@blackglory/pass'
import { go } from '@blackglory/go'
import { FiniteStateMachine } from '@blackglory/structures'
import { schema } from '@tasks/utils'

const workerFilename = path.resolve(__dirname, './worker.js')

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
    this.fsm.send('run')

    this.childProcess = fork(workerFilename, { serialization: 'advanced' })
    ;[this.client, this.cancelClient] = createClient<IAPI>(this.childProcess)

    this.task = new Deferred<void>()
    Promise.resolve(this.task).catch(pass)

    await go(async () => {
      try {
        await this.client?.run(this.filename, params)

        if (this.fsm.matches(TaskStatus.Stopping)) {
          this.fsm.send('stopEnd')
        } else {
          this.fsm.send('complete')
        }
        this.task?.resolve()
      } catch (e) {
        if (this.fsm.matches(TaskStatus.Stopping)) {
          this.fsm.send('stopEnd')
        } else {
          this.fsm.send('error')
        }
        this.task?.reject(e)
        throw e
      } finally {
        this.destroy()
      }
    })
  }

  async stop(): Promise<void> {
    this.fsm.send('stopBegin')

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
