import { createServer } from '@delight-rpc/websocket'
import { Daemon } from './daemon'
import { IAPI } from '@src/types'
import { Server } from 'ws'

export function startServer(daemon: Daemon, port: number): Server {
  const server = new Server({ port })
  server.on('connection', socket => {
    const close = createServer<IAPI>(daemon, socket)
    socket.once('close', () => close())
  })
  return server
}
