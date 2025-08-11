import { describe, expect, test, vi } from 'vitest'
import { RunnableFunction } from '@src/runnable-function.js'
import { Deferred } from 'extra-promise'
import { getErrorAsync } from 'return-style'
import { AbortError } from 'extra-abort'

describe('RunnableFunction', () => {
  test('run', async () => {
    const fn = vi.fn((signal, value) => value)
    const runnable = new RunnableFunction(fn)

    const result = await runnable.run('foo')

    expect(fn).toBeCalledTimes(1)
    expect(fn).toBeCalledWith(expect.any(AbortSignal), 'foo')
    expect(result).toBe('foo')
  })

  test('abort', async () => {
    const fn = vi.fn((signal: AbortSignal) => {
      const deferred = new Deferred()

      signal.addEventListener('abort', () => deferred.reject(signal.reason))

      return deferred
    })
    const runnable = new RunnableFunction(fn)

    const promise = getErrorAsync(() => runnable.run())
    runnable.abort()
    const err = await promise

    expect(fn).toBeCalledTimes(1)
    expect(err).toBeInstanceOf(AbortError)
  })

  test('clone', () => {
    const fn = vi.fn(() => 'foo')
    const runnable = new RunnableFunction(fn)

    const runnableClone = runnable.clone()
    const result = runnableClone.run()

    expect(runnableClone).not.toBe(runnable)
    expect(result).toBe('foo')
  })
})
