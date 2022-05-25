import { jest } from '@jest/globals'
import { Task, TaskState } from '@src/task.js'
import { IAdapter } from '@src/types.js'
import { getErrorPromise } from 'return-style'
import { pass } from '@blackglory/pass'
import { delay } from 'extra-promise'
import { mocked } from 'jest-mock'

describe('Task', () => {
  describe('create instance', () => {
    test('state should be created', async () => {
      const adapter = createAdapter()
      const task = new Task(adapter)

      expect(task.getState()).toBe(TaskState.Created)
      expect(adapter.init).not.toBeCalled()
    })
  })

  describe('init', () => {
    test('state should be ready', async () => {
      const adapter = createAdapter()
      const task = new Task(adapter)

      await task.init()

      expect(task.getState()).toBe(TaskState.Ready)
      expect(adapter.init).toBeCalledTimes(1)
      expect(adapter.run).not.toBeCalled()
    })

    test('state should be crashed', async () => {
      const adapter = createAdapter()
      const error = new Error('custom error')
      mocked(adapter.init).mockImplementation(() => {
        throw error
      })
      const task = new Task(adapter)

      const err = await getErrorPromise(task.init())

      expect(task.getState()).toBe(TaskState.Crashed)
      expect(err).toBe(error)
      expect(adapter.init).toBeCalledTimes(1)
      expect(adapter.run).not.toBeCalled()
    })

    test('reinitialize', async () => {
      const adapter = createAdapter()
      const error = new Error('custom error')
      mocked(adapter.init).mockImplementationOnce(() => {
        throw error
      })
      const task = new Task(adapter)

      const err1 = await getErrorPromise(task.init())
      const err2 = await getErrorPromise(task.init())

      expect(task.getState()).toBe(TaskState.Ready)
      expect(err1).toBe(error)
      expect(err2).toBeUndefined()
      expect(adapter.init).toBeCalledTimes(2)
      expect(adapter.run).not.toBeCalled()
    })
  })

  describe('run', () => {
    test('state should be running', async () => {
      const controller = new AbortController()
      const adapter = createAdapter()
      mocked(adapter.run).mockImplementation(async () => {
        while (true) {
          await delay(100)
          if (controller.signal.aborted) break
        }
      })
      const task = new Task(adapter)
      await task.init()

      try {
        task.run()
        await delay(1000)

        expect(task.getState()).toBe(TaskState.Running)
        expect(adapter.run).toBeCalledTimes(1)
        expect(adapter.run).toBeCalledWith()
      } finally {
        controller.abort()
      }
    })

    test('state should be completed', async () => {
      const adapter = createAdapter()
      mocked(adapter.run).mockImplementation(() => 'result')
      const task = new Task(adapter)
      await task.init()

      const result = await task.run()

      expect(task.getState()).toBe(TaskState.Completed)
      expect(result).toBe('result')
      expect(adapter.run).toBeCalledTimes(1)
      expect(adapter.run).toBeCalledWith()
    })

    test('state should be error', async () => {
      const adapter = createAdapter()
      const error = new Error('custom error')
      mocked(adapter.run).mockImplementation(() => {
        throw error
      })
      const task = new Task(adapter)
      await task.init()

      const err = await getErrorPromise(task.run())

      expect(task.getState()).toBe(TaskState.Error)
      expect(err).toBe(error)
      expect(adapter.run).toBeCalledTimes(1)
      expect(adapter.run).toBeCalledWith()
    })
  })

  describe('abort', () => {
    test('state should be stopping', async () => {
      const controller = new AbortController()
      const adapter = createAdapter()
      mocked(adapter.run).mockImplementation(async () => {
        while (true) {
          await delay(100)
          if (controller.signal.aborted) break
        }
      })
      mocked(adapter.abort).mockImplementation(() => controller.abort())
      const task = new Task(adapter)
      await task.init()

      task.run()
      await delay(1000)
      task.abort()

      expect(task.getState()).toBe(TaskState.Stopping)
      expect(adapter.abort).toBeCalledTimes(1)
    })

    test('state should be stopped', async () => {
      const adapter = createAdapter()
      const controller = new AbortController()
      mocked(adapter.run).mockImplementation(async () => {
        while (true) {
          await delay(100)
          if (controller.signal.aborted) break
        }
      })
      mocked(adapter.abort).mockImplementation(() => controller.abort())
      const task = new Task(adapter)
      await task.init()

      task.run()
      await delay(1000)
      await task.abort()

      expect(task.getState()).toBe(TaskState.Stopped)
      expect(adapter.abort).toBeCalledTimes(1)
    })

    describe('run() throws error', () => {
      test('state should be stopped', async () => {
        const adapter = createAdapter()
        const controller = new AbortController()
        mocked(adapter.run).mockImplementation(async () => {
          while (true) {
            await delay(100)
            if (controller.signal.aborted) throw new Error('custom error')
          }
        })
        mocked(adapter.abort).mockImplementation(() => controller.abort())
        const task = new Task(adapter)
        await task.init()

        task.run().catch(pass)
        await delay(1000)
        await task.abort()

        expect(task.getState()).toBe(TaskState.Stopped)
        expect(adapter.abort).toBeCalledTimes(1)
      })
    })

    describe('abort() throws error', () => {
      test('state should be stopping', async () => {
        const adapter = createAdapter()
        const controller = new AbortController()
        mocked(adapter.run).mockImplementation(async () => {
          while (true) {
            await delay(100)
            if (controller.signal.aborted) break
          }
        })
        const error = new Error('custom error')
        mocked(adapter.abort).mockImplementation(() => {
          throw error
        })
        const task = new Task(adapter)
        await task.init()

       try {
          task.run().catch(pass)
          await delay(1000)
          const err = await getErrorPromise(task.abort())

          expect(task.getState()).toBe(TaskState.Stopping)
          expect(err).toBe(error)
          expect(adapter.abort).toBeCalledTimes(1)
        } finally {
          controller.abort()
        }
      })

      describe('multiple calls', () => {
        test('state should be stopping', async () => {
          const adapter = createAdapter()
          const controller = new AbortController()
          mocked(adapter.run).mockImplementation(async () => {
            while (true) {
              await delay(100)
              if (controller.signal.aborted) break
            }
          })
          const error = new Error('custom error')
          mocked(adapter.abort).mockImplementation(() => {
            throw error
          })
          const task = new Task(adapter)
          await task.init()

          try {
            task.run().catch(pass)
            await delay(1000)
            const err1 = await getErrorPromise(task.abort())
            const err2 = await getErrorPromise(task.abort())

            expect(task.getState()).toBe(TaskState.Stopping)
            expect(err1).toBeInstanceOf(Error)
            expect(err2).toBeInstanceOf(Error)
            expect(adapter.abort).toBeCalledTimes(2)
          } finally {
            controller.abort()
          }
        })
      })
    })
  })

  describe('restart', () => {
    test('from stopped', async () => {
      const adapter = createAdapter()
      let controller: AbortController
      mocked(adapter.run).mockImplementation(async () => {
        controller = new AbortController()
        while (true) {
          await delay(100)
          if (controller.signal.aborted) break
        }
      })
      mocked(adapter.abort).mockImplementation(() => {
        controller.abort()
      })
      const task = new Task(adapter)
      await task.init()

      try {
        task.run()
        await delay(1000)
        await task.abort()
        task.run()

        expect(task.getState()).toBe(TaskState.Running)
        expect(adapter.init).toBeCalledTimes(1)
        expect(adapter.run).toBeCalledTimes(2)
      } finally {
        controller!.abort()
      }
    })

    test('from completed', async () => {
      const adapter = createAdapter()
      mocked(adapter.run).mockImplementation((text: string) => {
        return text
      })
      const task = new Task(adapter)
      await task.init()

      const result1 = await task.run('result1')
      const result2 = await task.run('result2')

      expect(task.getState()).toBe(TaskState.Completed)
      expect(result1).toBe('result1')
      expect(result2).toBe('result2')
      expect(adapter.init).toBeCalledTimes(1)
      expect(adapter.run).toBeCalledTimes(2)
    })

    test('from error', async () => {
      const adapter = createAdapter()
      const error = new Error('custom error')
      mocked(adapter.run).mockImplementation(() => {
        throw error
      })
      const task = new Task(adapter)
      await task.init()

      const err1 = await getErrorPromise(task.run())
      const err2 = await getErrorPromise(task.run())

      expect(task.getState()).toBe(TaskState.Error)
      expect(err1).toBe(error)
      expect(err2).toBe(error)
      expect(adapter.init).toBeCalledTimes(1)
      expect(adapter.run).toBeCalledTimes(2)
    })
  })

  test('destroy', async () => {
    const adapter = createAdapter()
    const task = new Task(adapter)
    await task.init()

    await task.destroy()

    expect(adapter.destroy).toBeCalledTimes(1)
  })
})

function createAdapter(): IAdapter<unknown, unknown[]> {
  return {
    abort: jest.fn()
  , destroy: jest.fn()
  , init: jest.fn()
  , run: jest.fn()
  } as IAdapter<unknown, unknown[]>
}
