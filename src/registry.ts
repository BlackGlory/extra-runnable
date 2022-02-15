import { createServer } from '@delight-rpc/websocket'
import { Daemon } from './daemon.js'
import { IAPI } from '@src/types.js'
import { delay } from 'extra-promise'
import { calculateExponentialBackoffTimeout } from 'extra-timers'
import WebSocket from 'ws'
import ms from 'ms'

export function registerInRegistry(daemon: Daemon, registry: string) {
  registerInRegistry()

  function registerInRegistry(retries: number = 0): void {
    const socket = new WebSocket(registry)
    const close = createServer<IAPI>(daemon, socket)
    socket.once('close', async () => {
      close()

      const timeout = calculateExponentialBackoffTimeout({
        baseTimeout: ms('10s')
      , maxTimeout: ms('60s')
      , retries
      })
      await delay(timeout)
      registerInRegistry(retries + 1)
    })
  }
}
