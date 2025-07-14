import { createServer } from 'http'

import { Redis } from 'ioredis'
import { Server } from 'socket.io'

import { logger } from './logger.js'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
const pubClient = redis.duplicate()
const subClient = redis.duplicate()

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    credentials: true,
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
})

// Handle connections
io.on('connection', socket => {
  logger.info('Client connected', { socketId: socket.id })

  // Join conversation room
  socket.on('join:conversation', async data => {
    const { conversationId, token } = data

    // Validate token
    if (!token) {
      socket.emit('error', { message: 'Authentication required' })
      return
    }

    // For now, we'll accept any token. In production, validate JWT here
    // Example: jwt.verify(token, process.env.JWT_SECRET)

    socket.data.conversationId = conversationId
    socket.join(`conversation:${conversationId}`)
    logger.info('Socket joined conversation', {
      conversationId,
      socketId: socket.id,
    })
  })

  // Handle chat messages
  socket.on('message:send', async data => {
    const { conversationId, message, chatbotId } = data

    // Verify user is in this conversation
    if (socket.data.conversationId !== conversationId) {
      socket.emit('error', { message: 'Not authorized for this conversation' })
      return
    }

    // Broadcast to conversation room
    io.to(`conversation:${conversationId}`).emit('message:received', {
      conversationId,
      id: Date.now().toString(),
      message,
      timestamp: new Date().toISOString(),
    })

    // Publish to Redis for other services (e.g., worker to process with AI)
    await pubClient.publish(
      'chat:messages',
      JSON.stringify({
        chatbotId,
        conversationId,
        message,
        sessionId: socket.id,
        timestamp: new Date().toISOString(),
      })
    )
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
subClient.on('message', (channel: string, message: string) => {
  if (channel === 'chat:messages') {
    const data = JSON.parse(message)

    // Handle different message types
    switch (data.type) {
      case 'stream':
        // Streaming chunk
        io.to(`conversation:${data.conversationId}`).emit('message:stream', {
          content: data.content,
          conversationId: data.conversationId,
          timestamp: data.timestamp,
        })
        break

      case 'complete':
        // Complete message with usage
        io.to(`conversation:${data.conversationId}`).emit('message:complete', {
          content: data.content,
          conversationId: data.conversationId,
          timestamp: data.timestamp,
          usage: data.usage,
        })
        break

      case 'error':
        // Error message
        io.to(`conversation:${data.conversationId}`).emit('message:error', {
          conversationId: data.conversationId,
          error: data.error,
          timestamp: data.timestamp,
        })
        break

      default:
        // Legacy format for backward compatibility
        io.to(`conversation:${data.conversationId}`).emit('message:ai', data)
    }
  }
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
