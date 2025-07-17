import { Orchestrator } from '@orchestrator/index.js'
import { RunnableConsumer } from '@src/types.js'
import { assert, Awaitable, pass } from '@blackglory/prelude'
import { AbortController } from 'extra-abort'

class RunnableStub<Params> implements RunnableConsumer<Params> {
  private controller?: AbortController

  constructor(private options: {
    init(): Awaitable<void>
    run(signal: AbortSignal, params: Params): Awaitable<void>
    abort(): Awaitable<void>
    destroy(): void
  }) {}

  init(): Awaitable<void> {
    return this.options.init()
  }

  run(params: Params): Awaitable<void> {
    const controller = new AbortController()
    this.controller = controller

    return this.options.run(controller.signal, params)
  }

  abort(): Awaitable<void> {
    assert(this.controller, 'controller is not defined')

    this.controller.abort()
    return this.options.abort()
  }

  destroy(): Awaitable<void> {
    delete this.controller
    this.options.destroy()
  }
}

export function createOrchestrator(
  {
    params
  , initTask = pass
  , runTask = pass
  , abortTask = pass
  , destroyTask = pass
  }: {
    params?: unknown
    initTask?: () => Awaitable<void>
    runTask?: (signal: AbortSignal, params: unknown) => Awaitable<void>
    abortTask?: () => Awaitable<void>
    destroyTask?: () => Awaitable<void>
  } = {}
): Orchestrator<unknown> {
  return new Orchestrator(
    () => new RunnableStub({
      init: initTask
    , run: runTask
    , abort: abortTask
    , destroy: destroyTask
    })
  , params
  )
}
