import { assert } from '@blackglory/prelude'
import { createServer } from '@delight-rpc/child-process'
import { importRawRunnableModule } from '@utils/import-raw-runnable-module.js'
import { IRawRunnableModule } from '@src/types.js'
import { IAPI } from './types.js'

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

createServer<IAPI<unknown[], unknown>>(new API(), process)
