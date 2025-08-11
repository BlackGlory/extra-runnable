import { assert } from '@blackglory/prelude'
import { createServer } from '@delight-rpc/worker-threads'
import { parentPort, isMainThread } from 'worker_threads'
import { importRawRunnableModule } from '@utils/import-raw-runnable-module.js'
import { IRawRunnableModule } from '@src/types.js'
import { IAPI } from './types.js'

assert(!isMainThread, 'This worker should not be run on main thread')
assert(parentPort, 'This worker should be run on worker thread')

class API<Args extends unknown[], Result> implements IAPI<Args, Result> {
  private controller?: AbortController
  private module?: IRawRunnableModule<Args, Result>

  async init(filename: string): Promise<void> {
    const module = await importRawRunnableModule<Args, Result>(filename)
    this.module = module
  }

  async run(args: Args): Promise<Result> {
    assert(this.module)
    this.controller = new AbortController()

    const promise = this.module.default(this.controller.signal, ...args)

    return await promise
  }

  abort(): void {
    assert(this.controller)

    this.controller.abort()
    this.controller = undefined
  }
}

createServer<IAPI<unknown[], unknown>>(new API(), parentPort)
