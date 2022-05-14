import { IAdapter, TaskFunction } from '@src/types.js'
import { Deferred } from 'extra-promise'
import { assert, pass, isntUndefined, Awaitable } from '@blackglory/prelude'
import { AbortController } from 'extra-abort'
import { importTaskFunction } from '@utils/import-task-function.js'

abstract class AsyncAdapter<Result, Args extends unknown[]> implements IAdapter<Result, Args> {
  protected controller?: AbortController
  protected task?: Deferred<void>
  protected taskFunction?: TaskFunction<Result, Args>

  abstract init(): Awaitable<void>

  async run(...args: Args): Promise<Result> {
    const controller = new AbortController()
    this.controller = controller

    assert(isntUndefined(this.taskFunction), 'module is undefined')
    return await this.taskFunction(controller.signal, ...args)
  }

  async abort(): Promise<void> {
    assert(this.controller, 'controller is undefined')

    this.controller.abort()
  }

  destroy(): void {
    delete this.controller
  }
}

export class AsyncModuleAdapter<Result, Args extends unknown[]> extends AsyncAdapter<Result, Args> {
  constructor(private filename: string) {
    super()
  }

  async init(): Promise<void> {
    this.taskFunction = await importTaskFunction<Result, Args>(this.filename)
  }
}

export class AsyncFunctionAdapter<Result, Args extends unknown[]> extends AsyncAdapter<Result, Args> {
  constructor(taskFunction: TaskFunction<Result, Args>) {
    super()
    this.taskFunction = taskFunction
  }

  init(): void {
    pass()
  }
}
