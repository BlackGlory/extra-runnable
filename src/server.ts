import { createServer, Level } from '@delight-rpc/websocket'
import { Daemon } from './daemon.js'
import { IAPI } from '@src/types.js'
import ws from 'ws'

export function startServer(daemon: Daemon, port: number): ws.Server {
  const server = new ws.Server({ port })
  server.on('connection', socket => {
    const close = createServer<IAPI>(daemon, socket, {
      loggerLevel: Level.None
    })
    socket.once('close', () => close())
  })
  return server
}
