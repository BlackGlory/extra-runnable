import { jest } from '@jest/globals'
import { Task, TaskState } from '@src/task.js'
import { AsyncAdapter } from '@adapters/async.js'
import { getErrorPromise } from 'return-style'
import { pass } from '@blackglory/pass'
import { delay } from 'extra-promise'

describe('AsyncAdapter', () => {
  describe('init', () => {
    test('created', async () => {
      const fn = jest.fn(stoppable)
      const adapter = new AsyncAdapter(fn)
      const task = new Task(adapter)

      expect(task.getStatus()).toBe(TaskState.Created)
    })

    test('ready', async () => {
      const fn = jest.fn(stoppable)
      const adapter = new AsyncAdapter(fn)
      const task = new Task(adapter)

      try {
        await task.init()

        expect(task.getStatus()).toBe(TaskState.Ready)
      } finally {
        task.destroy()
      }
    })
  })

  describe('run', () => {
    test('running', async () => {
      const fn = jest.fn(stoppable)
      const adapter = new AsyncAdapter(fn)
      const task = new Task(adapter)
      await task.init()

      try {
        task.run()
        await delay(1000)

        expect(task.getStatus()).toBe(TaskState.Running)
      } finally {
        await task.abort()
        task.destroy()
      }
    })

    test('completed', async () => {
      const fn = jest.fn(completed)
      const adapter = new AsyncAdapter(fn)
      const task = new Task(adapter)
      await task.init()

      try {
        const result = await task.run()

        expect(task.getStatus()).toBe(TaskState.Completed)
        expect(result).toBe('result')
      } finally {
        task.destroy()
      }
    })

    test('error', async () => {
      const fn = jest.fn(error)
      const adapter = new AsyncAdapter(fn)
      const task = new Task(adapter)
      await task.init()

      try {
        const err = await getErrorPromise(task.run())

        expect(err).toBeInstanceOf(Error)
        expect(task.getStatus()).toBe(TaskState.Error)
      } finally {
        task.destroy()
      }
    })
  })

  describe('abort', () => {
    test('stopping', async () => {
      const fn = jest.fn(stoppable)
      const adapter = new AsyncAdapter(fn)
      const task = new Task(adapter)
      await task.init()

      task.run()
      await delay(1000)
      task.abort().then(() => task.destroy())

      expect(task.getStatus()).toBe(TaskState.Stopping)
    })

    test('stopped', async () => {
      const fn = jest.fn(stoppable)
      const adapter = new AsyncAdapter(fn)
      const task = new Task(adapter)
      await task.init()

      try {
        task.run()
        await delay(1000)
        await task.abort()

        expect(task.getStatus()).toBe(TaskState.Stopped)
      } finally {
        task.destroy()
      }
    })

    test('error', async () => {
      const fn = jest.fn(errorWhileStopping)
      const adapter = new AsyncAdapter(fn)
      const task = new Task(adapter)
      await task.init()

      try {
        task.run().catch(pass)
        await delay(1000)
        const err = await getErrorPromise(task.abort())

        expect(err).toBeInstanceOf(Error)
        expect(task.getStatus()).toBe(TaskState.Stopped)
      } finally {
        task.destroy()
      }
    })
  })
})

async function stoppable(signal: AbortSignal): Promise<void> {
  while (true) {
    await delay(100)
    if (signal.aborted) break
  }
}

async function errorWhileStopping(signal: AbortSignal): Promise<void> {
  while (true) {
    await delay(100)
    if (signal.aborted) throw new Error('error while stopping')
  }
}

async function error(signal: AbortSignal): Promise<void> {
  await delay(100)
  throw new Error('error')
}

async function completed(signal: AbortSignal): Promise<string> {
  await delay(100)
  return 'result'
}
