import { Server } from 'socket.io'
import { createServer } from 'http'
import Redis from 'ioredis'
import { logger } from './logger.js'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
const pubClient = redis.duplicate()
const subClient = redis.duplicate()

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})

// Handle connections
io.on('connection', socket => {
  logger.info('Client connected', { socketId: socket.id })

  // Join conversation room
  socket.on('join:conversation', async data => {
    const { conversationId, token } = data

    // TODO: Validate token

    socket.join(`conversation:${conversationId}`)
    logger.info('Socket joined conversation', { socketId: socket.id, conversationId })
  })

  // Handle chat messages
  socket.on('message:send', async data => {
    const { conversationId, message } = data

    // Broadcast to conversation room
    io.to(`conversation:${conversationId}`).emit('message:received', {
      id: Date.now().toString(),
      conversationId,
      message,
      timestamp: new Date().toISOString(),
    })
  })

  // Handle typing indicators
  socket.on('typing:start', data => {
    const { conversationId } = data
    socket.to(`conversation:${conversationId}`).emit('typing:start', {
      socketId: socket.id,
    })
  })

  socket.on('typing:stop', data => {
    const { conversationId } = data
    socket.to(`conversation:${conversationId}`).emit('typing:stop', {
      socketId: socket.id,
    })
  })

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id })
  })
})

// Redis pub/sub for cross-server communication
subClient.subscribe('chat:messages')
subClient.on('message', (channel, message) => {
  const data = JSON.parse(message)
  io.to(`conversation:${data.conversationId}`).emit('message:ai', data)
})

const PORT = process.env.WEBSOCKET_PORT || 3001

httpServer.listen(PORT, () => {
  logger.info(`WebSocket server listening on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing connections...')
  io.close(() => {
    process.exit(0)
  })
})
