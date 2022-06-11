import { assert, isError, isntUndefined, isString } from '@blackglory/prelude'
import { RunnableConsumerFactory } from '@src/types.js'
import { OrchestratorState, schema } from './fsm.js'
import { delay } from 'extra-promise'
import { calculateExponentialBackoffTimeout } from 'extra-timers'
import { FiniteStateMachine } from '@blackglory/structures'
import { RunnerState, Runner } from 'extra-runnable'
import { first } from 'iterable-operator'
import { Emitter } from '@blackglory/structures'
import { waitForAllMacrotasksProcessed } from '@blackglory/wait-for'
import { parseConcurrency } from '@utils/parse-concurrency.js'
import ms from 'ms'

type ConsumerRunner<Params> = Runner<void, [Params]>

export { OrchestratorState } from './fsm.js'

export class Orchestrator<Params> extends Emitter<{
  terminated: []

  /**
   * 用于在出错时提供错误信息, 主要为打印或记录日志而设计, 也可以用来在出错时停止Daemon.
   */
  error: [error: Error]
}> {
  private fsm = new FiniteStateMachine(schema, OrchestratorState.Running)
  private retries = 0
  private runners = new Set<ConsumerRunner<Params>>()

  constructor(
    private createRunnableConsumer: RunnableConsumerFactory<Params>
  , private params: Params
  ) {
    super()
  }

  getState(): OrchestratorState {
    return this.fsm.state
  }

  getNumberOfInstances(): number {
    return this.runners.size
  }

  async terminate(): Promise<void> {
    this.fsm.send('terminate')
    while (this.runners.size > 0) {
      const task = this.getFirstRunner()
      await this.stopRunner(task)
      this.removeRunner(task)
    }
    this.fsm.send('terminated')

    this.emit('terminated')
  }

  /**
   * 调整并发数, 这会导致任务被创建启动或关闭销毁.
   * 将并发数设为0会关闭销毁所有任务, 但不会导致程序退出.
   * 
   * 当concurrency是一个字符串时, 支持以下格式:
   * - `n`, 整数的字符串表示.
   * - `max`, 最大逻辑核心数, 相当于 `100%` 和 `1/1`.
   * - `half`, 一半逻辑核心数, 相当于 `50%` 和 `1/2`.
   * - `-n`, 最大逻辑核心数减去n.
   * - `n/m`, 按分数分配逻辑核心数.
   * - `n%`, 按百分比分配逻辑核心数.
   * 除 `0`, `0/m`, `0%` 外, 其他非整数情况都会向上取整.
   */
  async scale(concurrency: number | string): Promise<void> {
    const target = isString(concurrency)
      ? parseConcurrency(concurrency)
      : concurrency

    this.fsm.send('scale')
    while (
      this.fsm.matches(OrchestratorState.Scaling) &&
      this.getNumberOfInstances() !== target
    ) {
      while (
        this.fsm.matches(OrchestratorState.Scaling) &&
        this.getNumberOfInstances() < target
      ) {
        await this.scaleUp()
      }

      while (
        this.fsm.matches(OrchestratorState.Scaling) &&
        this.getNumberOfInstances() > target
      ) {
        await this.scaleDown()
      }
    }
    if (this.fsm.matches(OrchestratorState.Scaling)) {
      this.fsm.send('scaled')
    }
  }

  private async scaleUp(): Promise<void> {
    const task = await this.createRunner()
    this.addRunner(task)
    this.startRunner(task)
  }

  private async scaleDown(): Promise<void> {
    const task = this.getFirstRunner()
    await this.stopRunner(task)
    this.removeRunner(task)
  }

  private getFirstRunner(): ConsumerRunner<Params> {
    const task = first(this.runners)
    assert(isntUndefined(task), 'Task is undefined')

    return task
  }

  private async createRunner(): Promise<ConsumerRunner<Params>> {
    const adapter = await this.createRunnableConsumer()
    const runner = new Runner(adapter)
    await runner.init()
    return runner
  }

  private addRunner(runner: ConsumerRunner<Params>): void {
    this.runners.add(runner)
  }

  private removeRunner(taskRunner: ConsumerRunner<Params>): void {
    this.runners.delete(taskRunner)
  }

  private async startRunner(task: ConsumerRunner<Params>): Promise<void> {
    while (true) {
      try {
        await task.run(this.params)
      } catch (e) {
        assert(isError(e), 'e is not Error')

        this.emit('error', e)
      }

      switch (task.getState()) {
        // 通过调用abort方法中断了Task的执行, 这只可能发生在scaleDown之后, 即该Task被废弃.
        case RunnerState.Stopped:
          if (this.retries > 0) {
            this.retries--
          }
          return
        // 如果Task并非是一个循环, 则会在Task执行完毕时到达此状态, 需要立即重新运行它.
        case RunnerState.Completed:
          if (this.retries > 0) {
            this.retries--
          }
          break
        // Task以出错结束, 指数退避重试.
        case RunnerState.Error:
          await delay(calculateExponentialBackoffTimeout({
            baseTimeout: ms('1s')
          , maxTimeout: ms('30s')
          , retries: this.retries++
          }))
          break
        default: return
      }

      await waitForAllMacrotasksProcessed()
    }
  }

  private async stopRunner(task: ConsumerRunner<Params>): Promise<void> {
    while (task.getState() !== RunnerState.Destroyed) {
      if (task.getState() === RunnerState.Running) {
        await task.abort()
      }

      if (
        task.getState() === RunnerState.Ready ||
        task.getState() === RunnerState.Stopped ||
        task.getState() === RunnerState.Completed ||
        task.getState() === RunnerState.Error
      ) {
        return await task.destroy()
      }

      await waitForAllMacrotasksProcessed()
    }
  }
}
