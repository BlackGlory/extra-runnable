#!/usr/bin/env node
import { program } from 'commander'
import { assert } from '@blackglory/errors'
import createDebug from 'debug'
import { parseConcurrency } from '@utils/parse-concurrency.js'
import { isntNull, isUndefined } from '@blackglory/types'
import { Daemon } from './daemon.js'
import { startServer } from './server.js'
import { registerInRegistry } from './registry.js'
import { Mode, ITaskFactory } from './types.js'
import { AsyncTaskFactory, ThreadTaskFactory, ProcessTaskFactory } from './tasks/index.js'
import { nanoid } from 'nanoid'
import path from 'path'
import { importMetaModule } from '@utils/import-module.js'
import { name, version, description } from '@utils/package.js'

const debug = createDebug('cli')

interface IOptions {
  mode: string
  concurrency: string
  id?: string
  label?: string
  port?: string
  registry?: string
  meta?: string
}

program
  .name(name)
  .version(version)
  .description(description)
  .requiredOption('--mode <mode>')
  .option('--id <id>')
  .option('--label <label>')
  .option('--concurrency <concurrency>', '', '1')
  .option('--port <port>', 'port')
  .option('--registry <url>')
  .option('--meta <filename>')
  .argument('<filename>')
  .action(async (filename: string) => {
    const taskFilename = path.resolve(process.cwd(), filename)
    const options = program.opts<IOptions>()
    const id: string = getId(options)
    const label: string = getLabel(options)
    const mode: Mode = getMode(options)
    debug('mode: %s', mode)
    const concurrency: number = getConcurrency(options)
    debug('concurrency: %d', concurrency)
    const port: number | null = getPort(options)
    debug('port: %d', port)
    const registry: string | null = getRegistry(options)
    const metaFilename: string | null = getMeta(options)

    const daemon = new Daemon({
      id
    , label
    , taskFactory: getTaskFactory(mode, taskFilename)
    , metaModule: metaFilename ? await importMetaModule(metaFilename) : {}
    })
    daemon.setConcurrency(concurrency)

    if (isntNull(port)) {
      startServer(daemon, port)
    }

    if (isntNull(registry)) {
      registerInRegistry(daemon, registry)
    }
  })
  .parse()

function getTaskFactory(mode: Mode, filename: string): ITaskFactory<unknown> {
  switch (mode) {
    case Mode.Async: return new AsyncTaskFactory(filename)
    case Mode.Thread: return new ThreadTaskFactory(filename)
    case Mode.Process: return new ProcessTaskFactory(filename)
  }
}

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

function getMeta(options: IOptions): string | null {
  return options.meta ?? null
}

function getRegistry(options: IOptions): string | null {
  return options.registry ?? null
}

function isNumberString(str: string): boolean {
  return /^\d+$/.test(str)
}
