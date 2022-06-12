import { RunnableModuleAsProcess } from '@adapters/runnable-module-as-process/index.js'
import { getErrorPromise } from 'return-style'
import { getFixturePath } from './utils.js'

describe('RunnableModuleAsProcess', () => {
  describe('init', () => {
    test.each([
      'commonjs/bad.cjs'
    , 'esm/bad.js'
    ])('init bad module (%s)', async filename => {
      const adapter = new RunnableModuleAsProcess(getFixturePath(filename))

      const err = await getErrorPromise(adapter.init())

      expect(err).toBeInstanceOf(Error)
    })

    test.each([
      'commonjs/stoppable.cjs'
    , 'esm/stoppable.js'
    ])('init good module (%s)', async filename => {
      const adapter = new RunnableModuleAsProcess(getFixturePath(filename))

      await adapter.init()

      adapter.destroy()
    })
  })

  test.each([
    'commonjs/completed.cjs'
  , 'esm/completed.js'
  ])('run (%s)', async filename => {
    const adapter = new RunnableModuleAsProcess(getFixturePath(filename))
    await adapter.init()

    try {
      const result = await adapter.run('arg')

      expect(result).toBe('arg')
    } finally {
      adapter.destroy()
    }
  })

  test.each([
    'commonjs/stoppable.cjs'
  , 'esm/stoppable.js'
  ])('abort (%s)', async filename => {
    const adapter = new RunnableModuleAsProcess(getFixturePath(filename))
    await adapter.init()

    try {
      const promise = adapter.run()
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
    const adapter = new RunnableModuleAsProcess(getFixturePath(filename))
    await adapter.init()

    adapter.destroy()
  })
})
