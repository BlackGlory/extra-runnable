import { jest } from '@jest/globals'
import { Runner, RunnerState } from '@src/runner.js'
import { IRunnable } from '@src/types.js'
import { getErrorPromise } from 'return-style'
import { pass } from '@blackglory/pass'
import { delay } from 'extra-promise'
import { mocked } from 'jest-mock'
import { AbortController } from 'extra-abort'

describe('Runner', () => {
  describe('create instance', () => {
    test('state should be created', async () => {
      const runnable = createRunnable()
      const task = new Runner(runnable)

      expect(task.getState()).toBe(RunnerState.Created)
      expect(runnable.init).not.toBeCalled()
    })
  })

  describe('init', () => {
    test('state should be ready', async () => {
      const runnable = createRunnable()
      const task = new Runner(runnable)

      await task.init()

      expect(task.getState()).toBe(RunnerState.Ready)
      expect(runnable.init).toBeCalledTimes(1)
      expect(runnable.run).not.toBeCalled()
    })

    test('state should be crashed', async () => {
      const runnable = createRunnable()
      const error = new Error('custom error')
      mocked(runnable.init).mockImplementation(() => {
        throw error
      })
      const task = new Runner(runnable)

      const err = await getErrorPromise(task.init())

      expect(task.getState()).toBe(RunnerState.Crashed)
      expect(err).toBe(error)
      expect(runnable.init).toBeCalledTimes(1)
      expect(runnable.run).not.toBeCalled()
    })

    test('reinitialize', async () => {
      const runnable = createRunnable()
      const error = new Error('custom error')
      mocked(runnable.init).mockImplementationOnce(() => {
        throw error
      })
      const task = new Runner(runnable)

      const err1 = await getErrorPromise(task.init())
      const err2 = await getErrorPromise(task.init())

      expect(task.getState()).toBe(RunnerState.Ready)
      expect(err1).toBe(error)
      expect(err2).toBeUndefined()
      expect(runnable.init).toBeCalledTimes(2)
      expect(runnable.run).not.toBeCalled()
    })
  })

  describe('run', () => {
    test('state should be running', async () => {
      const controller = new AbortController()
      const runnable = createRunnable()
      mocked(runnable.run).mockImplementation(async () => {
        while (true) {
          await delay(100)
          if (controller.signal.aborted) break
        }
      })
      const task = new Runner(runnable)
      await task.init()

      try {
        task.run()
        await delay(1000)

        expect(task.getState()).toBe(RunnerState.Running)
        expect(runnable.run).toBeCalledTimes(1)
        expect(runnable.run).toBeCalledWith()
      } finally {
        controller.abort()
      }
    })

    test('state should be completed', async () => {
      const runnable = createRunnable()
      mocked(runnable.run).mockImplementation(() => 'result')
      const task = new Runner(runnable)
      await task.init()

      const result = await task.run()

      expect(task.getState()).toBe(RunnerState.Completed)
      expect(result).toBe('result')
      expect(runnable.run).toBeCalledTimes(1)
      expect(runnable.run).toBeCalledWith()
    })

    test('state should be error', async () => {
      const runnable = createRunnable()
      const error = new Error('custom error')
      mocked(runnable.run).mockImplementation(() => {
        throw error
      })
      const task = new Runner(runnable)
      await task.init()

      const err = await getErrorPromise(task.run())

      expect(task.getState()).toBe(RunnerState.Error)
      expect(err).toBe(error)
      expect(runnable.run).toBeCalledTimes(1)
      expect(runnable.run).toBeCalledWith()
    })
  })

  describe('abort', () => {
    test('state should be stopping', async () => {
      const controller = new AbortController()
      const runnable = createRunnable()
      mocked(runnable.run).mockImplementation(async () => {
        while (true) {
          await delay(100)
          if (controller.signal.aborted) break
        }
      })
      mocked(runnable.abort).mockImplementation(() => controller.abort())
      const task = new Runner(runnable)
      await task.init()

      task.run()
      await delay(1000)
      task.abort()

      expect(task.getState()).toBe(RunnerState.Stopping)
      expect(runnable.abort).toBeCalledTimes(1)
    })

    test('state should be stopped', async () => {
      const runnable = createRunnable()
      const controller = new AbortController()
      mocked(runnable.run).mockImplementation(async () => {
        while (true) {
          await delay(100)
          if (controller.signal.aborted) break
        }
      })
      mocked(runnable.abort).mockImplementation(() => controller.abort())
      const task = new Runner(runnable)
      await task.init()

      task.run()
      await delay(1000)
      await task.abort()

      expect(task.getState()).toBe(RunnerState.Stopped)
      expect(runnable.abort).toBeCalledTimes(1)
    })

    describe('run() throws error', () => {
      test('state should be stopped', async () => {
        const runnable = createRunnable()
        const controller = new AbortController()
        mocked(runnable.run).mockImplementation(async () => {
          while (true) {
            await delay(100)
            if (controller.signal.aborted) throw new Error('custom error')
          }
        })
        mocked(runnable.abort).mockImplementation(() => controller.abort())
        const task = new Runner(runnable)
        await task.init()

        task.run().catch(pass)
        await delay(1000)
        await task.abort()

        expect(task.getState()).toBe(RunnerState.Stopped)
        expect(runnable.abort).toBeCalledTimes(1)
      })
    })

    describe('abort() throws error', () => {
      test('state should be stopping', async () => {
        const runnable = createRunnable()
        const controller = new AbortController()
        mocked(runnable.run).mockImplementation(async () => {
          while (true) {
            await delay(100)
            if (controller.signal.aborted) break
          }
        })
        const error = new Error('custom error')
        mocked(runnable.abort).mockImplementation(() => {
          throw error
        })
        const task = new Runner(runnable)
        await task.init()

       try {
          task.run().catch(pass)
          await delay(1000)
          const err = await getErrorPromise(task.abort())

          expect(task.getState()).toBe(RunnerState.Stopping)
          expect(err).toBe(error)
          expect(runnable.abort).toBeCalledTimes(1)
        } finally {
          controller.abort()
        }
      })

      describe('multiple calls', () => {
        test('state should be stopping', async () => {
          const runnable = createRunnable()
          const controller = new AbortController()
          mocked(runnable.run).mockImplementation(async () => {
            while (true) {
              await delay(100)
              if (controller.signal.aborted) break
            }
          })
          const error = new Error('custom error')
          mocked(runnable.abort).mockImplementation(() => {
            throw error
          })
          const task = new Runner(runnable)
          await task.init()

          try {
            task.run().catch(pass)
            await delay(1000)
            const err1 = await getErrorPromise(task.abort())
            const err2 = await getErrorPromise(task.abort())

            expect(task.getState()).toBe(RunnerState.Stopping)
            expect(err1).toBeInstanceOf(Error)
            expect(err2).toBeInstanceOf(Error)
            expect(runnable.abort).toBeCalledTimes(2)
          } finally {
            controller.abort()
          }
        })
      })
    })
  })

  describe('restart', () => {
    test('from stopped', async () => {
      const runnable = createRunnable()
      let controller: AbortController
      mocked(runnable.run).mockImplementation(async () => {
        controller = new AbortController()
        while (true) {
          await delay(100)
          if (controller.signal.aborted) break
        }
      })
      mocked(runnable.abort).mockImplementation(() => {
        controller.abort()
      })
      const task = new Runner(runnable)
      await task.init()

      try {
        task.run()
        await delay(1000)
        await task.abort()
        task.run()

        expect(task.getState()).toBe(RunnerState.Running)
        expect(runnable.init).toBeCalledTimes(1)
        expect(runnable.run).toBeCalledTimes(2)
      } finally {
        controller!.abort()
      }
    })

    test('from completed', async () => {
      const runnable = createRunnable()
      mocked(runnable.run).mockImplementation((text: string) => {
        return text
      })
      const task = new Runner(runnable)
      await task.init()

      const result1 = await task.run('result1')
      const result2 = await task.run('result2')

      expect(task.getState()).toBe(RunnerState.Completed)
      expect(result1).toBe('result1')
      expect(result2).toBe('result2')
      expect(runnable.init).toBeCalledTimes(1)
      expect(runnable.run).toBeCalledTimes(2)
    })

    test('from error', async () => {
      const runnable = createRunnable()
      const error = new Error('custom error')
      mocked(runnable.run).mockImplementation(() => {
        throw error
      })
      const task = new Runner(runnable)
      await task.init()

      const err1 = await getErrorPromise(task.run())
      const err2 = await getErrorPromise(task.run())

      expect(task.getState()).toBe(RunnerState.Error)
      expect(err1).toBe(error)
      expect(err2).toBe(error)
      expect(runnable.init).toBeCalledTimes(1)
      expect(runnable.run).toBeCalledTimes(2)
    })
  })

  test('destroy', async () => {
    const runnable = createRunnable()
    const task = new Runner(runnable)
    await task.init()

    await task.destroy()

    expect(runnable.destroy).toBeCalledTimes(1)
  })
})

function createRunnable(): IRunnable<unknown, unknown[]> {
  return {
    abort: jest.fn()
  , destroy: jest.fn()
  , init: jest.fn()
  , run: jest.fn()
  } as IRunnable<unknown, unknown[]>
}
