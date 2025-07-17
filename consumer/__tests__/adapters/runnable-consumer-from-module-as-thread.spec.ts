import { describe, test, expect } from 'vitest'
import { RunnableConsumerFromModuleAsThread } from '@adapters/runnable-consumer-from-module-as-thread/index.js'
import { getErrorPromise } from 'return-style'
import { getFixturePath } from '@test/adapters/utils.js'

describe('RunnableConsumerFromModuleAsThread', () => {
  describe('init', () => {
    test.each([
      'commonjs/bad.cjs'
    , 'esm/bad.js'
    ])('init bad module (%s)', async filename => {
      const adapter = new RunnableConsumerFromModuleAsThread(getFixturePath(filename))

      const err = await getErrorPromise(adapter.init())

      expect(err).toBeInstanceOf(Error)
    })

    test.each([
      'commonjs/stoppable.cjs'
    , 'esm/stoppable.js'
    ])('init good module (%s)', async filename => {
      const adapter = new RunnableConsumerFromModuleAsThread(getFixturePath(filename))

      await adapter.init()

      adapter.destroy()
    })
  })

  test.each([
    'commonjs/completed.cjs'
  , 'esm/completed.js'
  ])('run (%s)', async filename => {
    const adapter = new RunnableConsumerFromModuleAsThread(getFixturePath(filename))
    await adapter.init()

    try {
      await adapter.run('password')
    } finally {
      adapter.destroy()
    }
  })

  test.each([
    'commonjs/stoppable.cjs'
  , 'esm/stoppable.js'
  ])('abort (%s)', async filename => {
    const adapter = new RunnableConsumerFromModuleAsThread(getFixturePath(filename))
    await adapter.init()

    try {
      const promise = adapter.run('password')
      await adapter.abort()
      await promise
    } finally {
      adapter.destroy()
    }
  })

  test.each([
    'commonjs/stoppable.cjs'
  , 'esm/stoppable.js'
  ])('destroy (%s)', async filename => {
    const adapter = new RunnableConsumerFromModuleAsThread(getFixturePath(filename))
    await adapter.init()

    adapter.destroy()
  })
})
