import { Worker } from 'worker_threads'
import * as path from 'path'
import { exponentialBackoff } from 'extra-retry'
import {} from 'hardware-concurrency'
import {} from 'fastify'

interface IMod<T> {
  /**
   * 主要daemon代码的所在地, 通过第一个参数接收getProps 的返回结果.
   */
  default: (props: T) => unknown

  /**
   * 只在第一次启动时于主线程处执行一次的函数，每个子线程的default函数都会收到此函数的返回结果.
   */
  getProps?: () => T

  /**
   * 退出时的异步回调函数.
   */
  onExit?: () => void | Promise<void>
}

export function startDaemon(filename: string, parallel: number, port?: number): void {
  const absoluteFilename = path.resolve(filename)

  const mod = require(absoluteFilename)

  new Worker(absoluteFilename)
}
