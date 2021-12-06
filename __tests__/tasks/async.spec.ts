import { AsyncTaskFactory } from '@src/tasks/async'
import { TaskStatus } from '@src/types'
import { getErrorPromise } from 'return-style'
import { pass } from '@blackglory/pass'
import { getFixturePath } from '@test/utils'

describe('AsyncTask', () => {
  test('ready', () => {
    const factory = new AsyncTaskFactory(getFixturePath('stopable.js'))
    const task = factory.create()

    expect(task.getStatus()).toBe(TaskStatus.Ready)
  })

  describe('start(params: T): Promise<void>', () => {
    test('running', async () => {
      const factory = new AsyncTaskFactory(getFixturePath('stopable.js'))
      const task = factory.create()

      try {
        task.start(undefined)

        expect(task.getStatus()).toBe(TaskStatus.Running)
      } finally {
        task.stop()
      }
    })

    test('completed', async () => {
      const factory = new AsyncTaskFactory(getFixturePath('completed.js'))
      const task = factory.create()

      await task.start(undefined)

      expect(task.getStatus()).toBe(TaskStatus.Completed)
    })

    test('error', async () => {
      const factory = new AsyncTaskFactory(getFixturePath('error.js'))
      const task = factory.create()

      const err = await getErrorPromise(task.start(undefined))

      expect(err).toBeInstanceOf(Error)
      expect(task.getStatus()).toBe(TaskStatus.Error)
    })
  })

  describe('stop(): Promise<void>', () => {
    test('stopping', async () => {
      const factory = new AsyncTaskFactory(getFixturePath('unstoppable.js'))
      const task = factory.create()

      task.start(undefined)
      task.stop()

      expect(task.getStatus()).toBe(TaskStatus.Stopping)
    })

    test('stopped', async () => {
      const factory = new AsyncTaskFactory(getFixturePath('stopable.js'))
      const task = factory.create()

      task.start(undefined)
      await task.stop()

      expect(task.getStatus()).toBe(TaskStatus.Stopped)
    })

    test('error', async () => {
      const factory = new AsyncTaskFactory(getFixturePath('error-while-stopping.js'))
      const task = factory.create()

      task.start(undefined).catch(pass)
      const err = await getErrorPromise(task.stop())

      expect(err).toBeInstanceOf(Error)
      expect(task.getStatus()).toBe(TaskStatus.Stopped)
    })
  })
})
