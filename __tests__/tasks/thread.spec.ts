import { ThreadTaskFactory } from '@src/tasks/thread'
import { TaskStatus } from '@src/types'
import { getErrorPromise } from 'return-style'
import { pass } from '@blackglory/pass'
import { getFixturePath } from '@test/utils'

describe('ThreadTask', () => {
  test('ready', () => {
    const factory = new ThreadTaskFactory(getFixturePath('stopable.js'))
    const task = factory.create()

    expect(task.getStatus()).toBe(TaskStatus.Ready)
  })

  describe('start(params: T): Promise<void>', () => {
    test('running', async () => {
      const factory = new ThreadTaskFactory(getFixturePath('stopable.js'))
      const task = factory.create()

      try {
        task.start(undefined).catch(pass)

        expect(task.getStatus()).toBe(TaskStatus.Running)
      } finally {
        task.destroy()
      }
    })

    test('completed', async () => {
      const factory = new ThreadTaskFactory(getFixturePath('completed.js'))
      const task = factory.create()

      try {
        await task.start(undefined)

        expect(task.getStatus()).toBe(TaskStatus.Completed)
      } finally {
        task.destroy()
      }
    })

    test('error', async () => {
      const factory = new ThreadTaskFactory(getFixturePath('error.js'))
      const task = factory.create()

      try {
        const err = await getErrorPromise(task.start(undefined))

        expect(err).toBeInstanceOf(Error)
        expect(task.getStatus()).toBe(TaskStatus.Error)
      } finally {
        task.destroy()
      }
    })
  })

  describe('stop(): Promise<void>', () => {
    test('stopping', async () => {
      const factory = new ThreadTaskFactory(getFixturePath('unstoppable.js'))
      const task = factory.create()

      try {
        task.start(undefined).catch(pass)
        task.stop().catch(pass)

        expect(task.getStatus()).toBe(TaskStatus.Stopping)
      } finally {
        task.destroy()
      }
    })

    test('stopped', async () => {
      const factory = new ThreadTaskFactory(getFixturePath('stopable.js'))
      const task = factory.create()

      try {
        task.start(undefined).catch(pass)
        await task.stop()

        expect(task.getStatus()).toBe(TaskStatus.Stopped)
      } finally {
        task.destroy()
      }
    })

    test('error', async () => {
      const factory = new ThreadTaskFactory(getFixturePath('error-while-stopping.js'))
      const task = factory.create()

      try {
        task.start(undefined).catch(pass)
        const err = await getErrorPromise(task.stop())

        expect(err).toBeInstanceOf(Error)
        expect(task.getStatus()).toBe(TaskStatus.Stopped)
      } finally {
        task.destroy()
      }
    })
  })
})
