#!/usr/bin/env node
import { program } from 'commander'
import { assert, isntNull, isUndefined } from '@blackglory/prelude'
import { parseConcurrency } from '@utils/parse-concurrency.js'
import { Orchestrator } from '@orchestrator/index.js'
import { nanoid } from 'nanoid'
import { version, description } from '@utils/package.js'
import { importConsumerModule } from '@utils/import-consumer-module.js'
import { API } from '@src/api.js'
import {
  createRPCServerOnExtraWebSocket
, createRPCServerOnWebSocketServer
} from '@utils/create-rpc-server.js'
import {
  RunnableConsumerFromModule
, RunnableConsumerFromModuleAsThread
, RunnableConsumerFromModuleAsProcess
} from '@adapters/index.js'
import { RunnableConsumerFactory } from '@src/types.js'
import { Destructor } from 'extra-defer'
import { promisify } from 'util'
import path from 'path'
import createDebug from 'debug'
import { youDied } from 'you-died'
import { waitForInput } from 'extra-prompts'
import { WebSocket, WebSocketServer } from 'ws'
import { AnyChannel } from 'delight-rpc'
import { ExtraWebSocket } from 'extra-websocket'
import * as DelightRPCWebSocket from '@delight-rpc/websocket'

enum Mode {
  Async
, Thread
, Process
}

interface IOptions {
  mode: string
  concurrency: string
  id?: string
  label?: string
  port?: string
  registry?: string
}

const debug = createDebug('cli')

program
  .name('run-consumer-module')
  .version(version)
  .description(description)
  .option('--id [id]')
  .option('--label [label]')
  .option('--mode [mode]', '', 'async')
  .option('--concurrency [concurrency]', '', '1')
  .option('--port [port]')
  .option('--registry [url]')
  .argument('<filename>')
  .action(async (filename: string) => {
    const destructor = new Destructor()
    const taskFilename = path.resolve(process.cwd(), filename)
    const options = program.opts<IOptions>()
    const id = getId(options)
    const label = getLabel(options)
    const mode = getMode(options)
    debug('mode: %s', mode)
    const concurrency: number = getConcurrency(options)
    debug('concurrency: %d', concurrency)
    const port = getPort(options)
    debug('port: %d', port)
    const registry = getRegistry(options)

    const module = await importConsumerModule(taskFilename)
    const params = module.init?.()

    const orchestrator = new Orchestrator<unknown>(
      getRunnableTaskFactory(mode, taskFilename)
    , params
    )

    {
      let error: Error | undefined
      orchestrator.once('terminated', async () => {
        try {
          await destructor.execute()
          await module.final?.(error)
        } finally {
          gracefulExit(error)
        }
      })
      orchestrator.once('error', async err => console.error(err))
      youDied(() => orchestrator.terminate())
    }

    const service = new API(orchestrator, { id, label })
    if (isntNull(port)) {
      const wsServer = new WebSocketServer({ port })
      destructor.defer(() => promisify(wsServer.close).bind(wsServer))

      const closeRPCServer = createRPCServerOnWebSocketServer(service, wsServer, {
        channel: AnyChannel
      , loggerLevel: DelightRPCWebSocket.Level.Info
      })
      destructor.defer(closeRPCServer)
    }

    if (isntNull(registry)) {
      const ws = new ExtraWebSocket(() => new WebSocket(registry))

      const closeRPCServer = createRPCServerOnExtraWebSocket(service, ws, {
        channel: AnyChannel
      , loggerLevel: DelightRPCWebSocket.Level.Info
      })
      destructor.defer(closeRPCServer)

      await ws.connect()
      destructor.defer(() => ws.close())
    }

    await orchestrator.scale(concurrency)

    await waitForInput(
      'Press q to terminate consumers...'
    , key => key === 'q'
    )
    await orchestrator.terminate()
  })
  .parse()

function getId(options: IOptions): string {
  return options.id ?? nanoid()
}

function getLabel(options: IOptions): string {
  return options.label ?? ''
}

function getConcurrency(options: IOptions): number {
  const concurrency = parseConcurrency(options.concurrency)
  assert(isntNull(concurrency), 'The parameter concurrency is invalid.')

  return concurrency
}

function getMode(options: IOptions): Mode {
  switch (options.mode) {
    case 'async': return Mode.Async
    case 'thread': return Mode.Thread
    case 'process': return Mode.Process
    default: throw new Error('The parameter mode must be one of "async", "thread", "process"')
  }
}

function getPort(options: IOptions): number | null{
  if (isUndefined(options.port)) return null

  assert(isNumberString(options.port), 'The parameter port must be an integer')
  const port = Number.parseInt(options.port, 10)
  assert(port >= 0, 'The parameter port must greater than or equal to zero')

  return port
}

function getRegistry(options: IOptions): string | null {
  return options.registry ?? null
}

function isNumberString(str: string): boolean {
  return /^\d+$/.test(str)
}

function getRunnableTaskFactory<Params>(mode: Mode, filename: string): RunnableConsumerFactory<Params> {
  switch (mode) {
    case Mode.Async: return () => new RunnableConsumerFromModule(filename)
    case Mode.Thread: return () => new RunnableConsumerFromModuleAsThread(filename)
    case Mode.Process: return () => new RunnableConsumerFromModuleAsProcess(filename)
  }
}

function gracefulExit(error?: Error): never {
  if (error) {
    console.error(error)
    process.exit(1)
  } else {
    process.exit()
  }
}
