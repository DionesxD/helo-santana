import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer((req, res) => {
  // CORS headers simples
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // POST /notify — recebe notificação do backend Next.js e repassa ao socket do usuário
  if (req.method === 'POST' && req.url === '/notify') {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      try {
        const { usuarioId, payload } = JSON.parse(body)
        if (usuarioId && payload) {
          io.to(`user:${usuarioId}`).emit('notificacao', payload)
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'invalid body' }))
      }
    })
    return
  }

  res.writeHead(404)
  res.end('not found')
})

const io = new Server(httpServer, {
  // path "/" obrigatório para o Caddy encaminhar via XTransformPort
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

io.on('connection', (socket) => {
  socket.on('register', (data: { usuarioId: string }) => {
    if (data?.usuarioId) {
      socket.join(`user:${data.usuarioId}`)
      console.log(`[notify] socket ${socket.id} registered for user ${data.usuarioId}`)
    }
  })
  socket.on('disconnect', () => {
    // rooms são limpos automaticamente
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`[notify-service] rodando na porta ${PORT}`)
})

process.on('SIGTERM', () => httpServer.close(() => process.exit(0)))
process.on('SIGINT', () => httpServer.close(() => process.exit(0)))
