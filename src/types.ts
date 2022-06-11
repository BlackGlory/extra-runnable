import { Awaitable } from '@blackglory/prelude'
import { OrchestratorState } from '@orchestrator/fsm.js'
import { IRunnable } from 'extra-runnable'

export type RunnableConsumer<Params> = IRunnable<void, [Params]>

export type RunnableConsumerFactory<Params> =
  () => Awaitable<RunnableConsumer<Params>>

export type Consumer<Params> =
  (signal: AbortSignal, params: Params) => Awaitable<void>

export interface IConsumerModule<Params> {
  /**
   * 被执行的消费者本身.
   * 
   * 消费者结束的定义:
   * - 返回非PromiseLike值
   * - 返回PromiseLike值, 且PromiseLike到达resolved或rejected状态.
   * - 抛出错误.
   *
   * 当消费者结束并非主动造成时, 会根据情况采取不同的重启方式:
   * 如果结束是因为函数返回, 则会立即重启任务.
   * 如果结束是因为抛出错误, 则会根据指数退避策略重启任务.
   *
   * @param {AbortSignal} signal 当要求结束任务时, 该参数会发出中止信号, 任务此时需要自行让消费者结束.
   */
  default: Consumer<Params>

  /**
   * 初始化函数, 返回值是default函数的params.
   * 该函数返回后, 任务才会启动.
   */
  init?: () => Awaitable<Params>

  /**
   * 一个钩子, 当程序退出时, 会调用它执行清理工作.
   * 只有在成功执行init之后, 才有可能调用final, 如果程序在init之前就退出, 则final不会被调用.
   * @param {error} 如果导致程序退出的原因是错误, 则提供此参数.
   */
  final?: (error?: Error) => Awaitable<void>
}

export interface IAPI {
  getId(): string
  setLabel(val: string): null
  getLabel(): string
  getState(): OrchestratorState
  getConcurrency(): number

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
  scale(concurrency: number | string): null

  terminate(): null
}
