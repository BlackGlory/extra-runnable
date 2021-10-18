#!/usr/bin/env node
import { program } from 'commander'
import { assert } from '@blackglory/errors'
import { go } from '@blackglory/go'
import { startDaemon } from './start-daemon'

program
  .name('daemon-threads')
  .version(require('../package.json').version)
  .description(require('../package.json').description)
  .option('--parallel <number>', 'threads', '1')
  .option('--port <number>', 'port')
  .argument('<filename>')
  .action((filename: string) => {
    const opts = program.opts()
    const parallel: number = go(() => {
      assert(isNumberString(opts.parallel), 'The parameter parallel must be an integer')

      const parallel = Number.parseInt(opts.parallel, 10)
      assert(parallel > 0, 'The parameter parallel must greater than zero')

      return parallel
    })
    const port: number = go(() => {
      assert(isNumberString(opts.port), 'The parameter port must be an integer')

      const port = Number.parseInt(opts.parallel, 10)
      assert(port > 0, 'The parameter port must greater than zero')

      return port
    })

    startDaemon(filename, parallel, port)
  })
  .parse()

function isNumberString(str: string): boolean {
  return /^\d+$/.test(str)
}
