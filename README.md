# @blackglory/consumer
## Install
```sh
# Install as a library
npm install @blackglory/consumer
# or
yarn add @blackglory/consumer

# Install as a CLI program
npm install --global @blackglory/consumer
# or
yarn global add @blackglory/consumer
```

## API
```typescript
import { Runner, IRunnable } from 'extra-runnable'

type RunnableConsumer<Params> = IRunnable<void, [Params]>

type RunnableConsumerFactory<Params> =
  () => Awaitable<RunnableConsumer<Params>>

type Consumer<Params> =
  (signal: AbortSignal, params: Params) => Awaitable<void>

interface IConsumerModule<Params> {
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

interface IAPI {
  getId(): string
  setLabel(val: string): null
  getLabel(): string
  getState(): OrchestratorState
  getConcurrency(): number

  /**
    ,* 调整并发数, 这会导致任务被创建启动或关闭销毁.
    ,* 将并发数设为0会关闭销毁所有任务, 但不会导致程序退出.
    ,* 
    ,* 当concurrency是一个字符串时, 支持以下格式:
    ,* - `n`, 整数的字符串表示.
    ,* - `max`, 最大逻辑核心数, 相当于 `100%` 和 `1/1`.
    ,* - `half`, 一半逻辑核心数, 相当于 `50%` 和 `1/2`.
    ,* - `-n`, 最大逻辑核心数减去n.
    ,* - `n/m`, 按分数分配逻辑核心数.
    ,* - `n%`, 按百分比分配逻辑核心数.
    ,* 除 `0`, `0/m`, `0%` 外, 其他非整数情况都会向上取整.
    ,*/
  scale(concurrency: number | string): null

  terminate(): null
}
```

### Orchestrator
```typescript
class Orchestrator<Params> extends Emitter<{
  terminated: []

  /**
   * 用于在出错时提供错误信息, 主要为打印或记录日志而设计, 也可以用来在出错时停止Daemon.
   */
  error: [error: Error]
}> {
  constructor(
    createRunnableConsumer: RunnableConsumerFactory<Params>
  , params: Params
  )

  getState(): OrchestratorState
  getNumberOfInstances(): number
  terminate(): Promise<void>
  scale(target: number): Promise<void>
}
```

### Adapters
#### RunnableConsumerFromFunction
```typescript
class RunnableConsumerFromFunction<Params> implements RunnableConsumer<Params> {
  constructor(fn: Consumer<Params>)
}
```

#### RunnableConsumerFromModule
```typescript
class RunnableConsumerFromModule<Params> implements RunnableConsumer<Params> {
  /**
   * @param filename export `IConsumerModule<Params>`
   */
  constructor(filename: string)
}
```

#### RunnableConsumerFromModuleAsThread
```typescript
class RunnableConsumerFromModuleAsThread<Params> implements RunnableConsumer<Params> {
  /**
   * @param filename export `IConsumerModule<Params>`
   */
  constructor(filename: string)
}
```

#### RunnableConsumerFromModuleAsProcess
```typescript
class RunnableConsumerFromModuleAsProcess<Params> implements RunnableConsumer<Params> {
  /**
   * @param filename export `IConsumerModule<Params>`
   */
  constructor(filename: string)
}
```

### API
```typescript
class API<Params> implements ImplementationOf<IAPI> {
  constructor(
    orchestrator: Orchestrator<Params>
  , options: {
      id: string
      label: string
    }
  )
}
```

## CLI
### `run-consumer-module [...options] <filename>`
将`IConsumerModule<unknown>`作为一个Orchestrator运行.

```
Usage: run-consumer-module [options] <filename>

Options:
  -V, --version                output the version number
  --id <id>
  --label <label>
  --mode <mode>                 (default: "async")
  --concurrency <concurrency>   (default: "1")
  --port <port>
  --registry <url>
  -h, --help                   display help for command
```

#### `--id [string]` (可选, 默认为随机生成的UUID)
该Orchestrator的id.

#### `--label [string]` (可选)
该Orchestrator的label.

#### `--mode <string>` (可选, 默认为`async`)
- `async`: 适用于I/O密集型的任务, 如果脚本包含CPU密集型代码, 则会导致阻塞.
- `thread`: 适用于CPU密集型的任务, 采用线程模型, 使用worker_threads模块.
  init函数的返回值必须是可序列化的.
- `process`: 适用于CPU密集型的任务, 采用进程模型, 使用child_process模块.
  init函数的返回值必须是可序列化的.
  该模式是为了弥补thread模式下Worker无法使用部分Native模块的不足而出现的.
  由于thread模式的资源开销更小, 应优先使用thread模式.

#### `--concurrency <number | string>` (可选, 默认为1)
该Orchestrator的并发数.

当concurrency是一个字符串时, 支持以下格式:
- `n`, 整数的字符串表示.
- `max`, 最大逻辑核心数, 相当于`100%`和`1/1`.
- `half`, 一半逻辑核心数, 相当于`50%`和`1/2`.
- `-n`, 最大逻辑核心数减去n.
- `n/m`, 按分数分配逻辑核心数.
- `n%`, 按百分比分配逻辑核心数.
除`0`, `0/m`, `0%` 外, 其他非整数情况都会向上取整.

#### `--port <number>` (可选)
RPC服务器的端口号.
若提供此项, 则会开启RPC服务器.

#### `--registry <url>` (可选)
需要连接的远程registry地址, 例如`ws://localhost:8080`.
