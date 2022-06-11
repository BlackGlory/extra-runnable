import { jest } from '@jest/globals'
import { RunnableFunction } from '@src/runnable-function.js'
import { AbortSignal } from 'extra-abort'
import { delay } from 'extra-promise'

describe('RunnableFunction', () => {
  test('init', () => {
    const fn = jest.fn()
    const runnable = new RunnableFunction(fn)

    runnable.init()

    expect(fn).not.toBeCalled()
  })

  test('run', async () => {
    const fn = jest.fn((signal: AbortSignal, text: string) => text)
    const runnable = new RunnableFunction(fn)
    runnable.init()

    const result = await runnable.run('arg')

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
    const runnable = new RunnableFunction(fn)
    runnable.init()

    const promise = runnable.run('arg')
    runnable.abort()
    const result = await promise

    expect(result).toBe('arg')
  })

  test('destroy', () => {
    const fn = jest.fn()
    const runnable = new RunnableFunction(fn)
    runnable.init()

    runnable.destroy()

    expect(fn).not.toBeCalled()
  })
})
