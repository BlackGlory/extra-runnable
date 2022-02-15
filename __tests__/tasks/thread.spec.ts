import { ThreadTaskFactory } from '@src/tasks/thread/index.js'
import { TaskStatus, FatalError } from '@src/types.js'
import { getErrorPromise } from 'return-style'
import { pass } from '@blackglory/pass'
import { getFixturePath } from '@test/utils.js'
import { delay } from 'extra-promise'

describe('ThreadTask', () => {
  describe('module does not exist', () => {
    it('throws FatalError', async () => {
      const factory = new ThreadTaskFactory(getFixturePath('not-exist.js'))
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
      const factory = new ThreadTaskFactory(getFixturePath(filename))
      const task = factory.create()

      const err = await getErrorPromise(task.start(undefined))

      expect(err).toBeInstanceOf(FatalError)
    })
  })

  test.each([
    'commonjs/stopable.cjs'
  , 'esm/stopable.js'
  ])('ready (%s)', filename => {
    const factory = new ThreadTaskFactory(getFixturePath(filename))
    const task = factory.create()

    expect(task.getStatus()).toBe(TaskStatus.Ready)
  })

  describe('start(params: T): Promise<void>', () => {
    test.each([
      'commonjs/stopable.cjs'
    , 'esm/stopable.js'
    ])('running (%s)', async filename => {
      const factory = new ThreadTaskFactory(getFixturePath(filename))
      const task = factory.create()

      try {
        task.start(undefined).catch(pass)
        await delay(1000)

        expect(task.getStatus()).toBe(TaskStatus.Running)
      } finally {
        task.destroy()
      }
    })

    test.each([
      'commonjs/completed.cjs'
    , 'esm/completed.js'
    ])('completed (%s)', async filename => {
      const factory = new ThreadTaskFactory(getFixturePath(filename))
      const task = factory.create()

      try {
        await task.start(undefined)

        expect(task.getStatus()).toBe(TaskStatus.Completed)
      } finally {
        task.destroy()
      }
    })

    test.each([
      'commonjs/error.cjs'
    , 'esm/error.js'
    ])('error (%s)', async filename => {
      const factory = new ThreadTaskFactory(getFixturePath(filename))
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
    test.each([
      'commonjs/stopable.cjs'
    , 'esm/stopable.js'
    ])('stopping (%s)', async filename => {
      const factory = new ThreadTaskFactory(getFixturePath(filename))
      const task = factory.create()

      try {
        task.start(undefined).catch(pass)
        await delay(1000)
        task.stop().catch(pass)

        expect(task.getStatus()).toBe(TaskStatus.Stopping)
      } finally {
        task.destroy()
      }
    })

    test.each([
      'commonjs/stopable.cjs'
    , 'esm/stopable.js'
    ])('stopped (%s)', async filename => {
      const factory = new ThreadTaskFactory(getFixturePath(filename))
      const task = factory.create()

      try {
        task.start(undefined).catch(pass)
        await delay(1000)
        await task.stop()

        expect(task.getStatus()).toBe(TaskStatus.Stopped)
      } finally {
        task.destroy()
      }
    })

    test.each([
      'commonjs/error-while-stopping.cjs'
    , 'esm/error-while-stopping.js'
    ])('error (%s)', async filename => {
      const factory = new ThreadTaskFactory(getFixturePath(filename))
      const task = factory.create()

      try {
        task.start(undefined).catch(pass)
        await delay(1000)
        const err = await getErrorPromise(task.stop())

        expect(err).toBeInstanceOf(Error)
        expect(task.getStatus()).toBe(TaskStatus.Stopped)
      } finally {
        task.destroy()
      }
    })
  })
})
