import { AsyncTaskFactory } from '@src/tasks/async.js'
import { TaskStatus, FatalError } from '@src/types.js'
import { getErrorPromise } from 'return-style'
import { pass } from '@blackglory/pass'
import { getFixturePath } from '@test/utils.js'
import { delay } from 'extra-promise'

describe('AsyncTask', () => {
  describe('module does not exist', () => {
    it('throws FatalError', async () => {
      const factory = new AsyncTaskFactory(getFixturePath('not-exist.js'))
      const task = factory.create()

      const err = await getErrorPromise(task.start(undefined))

      expect(err).toBeInstanceOf(FatalError)
    })
  })

  describe.each([
    'commonjs/bad.cjs'
  , 'esm/bad.js'
  ])('bad module (%s)', filename => {
    it('throws FatalError', async () => {
      const factory = new AsyncTaskFactory(getFixturePath(filename))
      const task = factory.create()

      const err = await getErrorPromise(task.start(undefined))

      expect(err).toBeInstanceOf(FatalError)
    })
  })

  test.each([
    'commonjs/stopable.cjs'
  , 'esm/stopable.js'
  ])('ready (%s)', async filename => {
    const factory = new AsyncTaskFactory(getFixturePath(filename))
    const task = await factory.create()

    expect(task.getStatus()).toBe(TaskStatus.Ready)
  })

  describe('start(params: T): Promise<void>', () => {
    test.each([
      'commonjs/stopable.cjs'
    , 'esm/stopable.js'
    ])('running (%s)', async filename => {
      const factory = new AsyncTaskFactory(getFixturePath(filename))
      const task = await factory.create()

      try {
        task.start(undefined)
        await delay(1000)

        expect(task.getStatus()).toBe(TaskStatus.Running)
      } finally {
        task.stop()
      }
    })

    test.each([
      'commonjs/completed.cjs'
    , 'esm/completed.js'
    ])('completed (%s)', async filename => {
      const factory = new AsyncTaskFactory(getFixturePath(filename))
      const task = await factory.create()

      await task.start(undefined)

      expect(task.getStatus()).toBe(TaskStatus.Completed)
    })

    test.each([
      'commonjs/error.cjs'
    , 'esm/error.js'
    ])('error (%s)', async filename => {
      const factory = new AsyncTaskFactory(getFixturePath(filename))
      const task = await factory.create()

      const err = await getErrorPromise(task.start(undefined))

      expect(err).toBeInstanceOf(Error)
      expect(task.getStatus()).toBe(TaskStatus.Error)
    })
  })

  describe('stop(): Promise<void>', () => {
    test.each([
      'commonjs/unstoppable.cjs'
    , 'esm/unstoppable.js'
    ])('stopping (%s)', async filename => {
      const factory = new AsyncTaskFactory(getFixturePath(filename))
      const task = await factory.create()

      task.start(undefined)
      await delay(1000)
      task.stop()

      expect(task.getStatus()).toBe(TaskStatus.Stopping)
    })

    test.each([
      'commonjs/stopable.cjs'
    , 'esm/stopable.js'
    ])('stopped (%s)', async filename => {
      const factory = new AsyncTaskFactory(getFixturePath(filename))
      const task = await factory.create()

      task.start(undefined)
      await delay(1000)
      await task.stop()

      expect(task.getStatus()).toBe(TaskStatus.Stopped)
    })

    test.each([
      'commonjs/error-while-stopping.cjs'
    , 'esm/error-while-stopping.js'
    ])('error (%s)', async filename => {
      const factory = new AsyncTaskFactory(getFixturePath(filename))
      const task = await factory.create()

      task.start(undefined).catch(pass)
      await delay(1000)
      const err = await getErrorPromise(task.stop())

      expect(err).toBeInstanceOf(Error)
      expect(task.getStatus()).toBe(TaskStatus.Stopped)
    })
  })
})
