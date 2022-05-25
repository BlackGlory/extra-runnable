import { jest } from '@jest/globals'
import { AsyncAdapter } from '@adapters/async.js'
import { AbortSignal } from 'extra-abort'
import { delay } from 'extra-promise'

describe('AsyncAdapter', () => {
  test('init', () => {
    const fn = jest.fn()
    const adapter = new AsyncAdapter(fn)

    adapter.init()

    expect(fn).not.toBeCalled()
  })

  test('run', async () => {
    const fn = jest.fn((signal: AbortSignal, text: string) => text)
    const adapter = new AsyncAdapter(fn)
    adapter.init()

    const result = await adapter.run('arg')

    expect(fn).toBeCalledTimes(1)
    expect(fn).toBeCalledWith(expect.any(AbortSignal), 'arg')
    expect(result).toBe('arg')
  })

  test('abort', async () => {
    const fn = jest.fn(async (signal: AbortSignal, text: string) => {
      while (true) {
        await delay(100)
        if (signal.aborted) return text
      }
    })
    const adapter = new AsyncAdapter(fn)
    adapter.init()

    const promise = adapter.run('arg')
    await adapter.abort()
    const result = await promise

    expect(result).toBe('arg')
  })

  test('destroy', () => {
    const fn = jest.fn()
    const adapter = new AsyncAdapter(fn)
    adapter.init()

    adapter.destroy()

    expect(fn).not.toBeCalled()
  })
})
