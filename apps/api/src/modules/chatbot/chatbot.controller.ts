import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateChatbotDto, IChatbotService, UpdateChatbotDto } from './chatbot.interfaces.js'

interface ChatbotParams {
  id: string
}

interface EmbedParams {
  embedId: string
}

export class ChatbotController {
  constructor(private readonly chatbotService: IChatbotService) {}

  async create(request: FastifyRequest<{ Body: CreateChatbotDto }>, reply: FastifyReply) {
    const chatbot = await this.chatbotService.create({
      ...request.body,
      tenantId: request.user.tenantId,
    })
    return reply.code(201).send(chatbot)
  }

  async findById(request: FastifyRequest<{ Params: ChatbotParams }>, reply: FastifyReply) {
    const chatbot = await this.chatbotService.findById(request.params.id)

    if (!chatbot) {
      return reply.code(404).send({ message: 'Chatbot not found' })
    }

    // Ensure user has access to this chatbot
    if (chatbot.tenantId !== request.user.tenantId) {
      return reply.code(403).send({ message: 'Access denied' })
    }

    return chatbot
  }

  async findByEmbedId(request: FastifyRequest<{ Params: EmbedParams }>, reply: FastifyReply) {
    const chatbot = await this.chatbotService.findByEmbedId(request.params.embedId)

    if (!chatbot) {
      return reply.code(404).send({ message: 'Chatbot not found' })
    }

    // Public endpoint - only return necessary data for widget
    return {
      animationMap: chatbot.animationMap,
      avatarModelUrl: chatbot.avatarModelUrl,
      avatarPosition: chatbot.avatarPosition,
      avatarScale: chatbot.avatarScale,
      behaviors: chatbot.behaviors,
      id: chatbot.id,
      name: chatbot.name,
      placement: chatbot.placement,
      theme: chatbot.theme,
      welcomeMessage: chatbot.welcomeMessage,
    }
  }

  async findAllByTenant(request: FastifyRequest, _reply: FastifyReply) {
    const chatbots = await this.chatbotService.findAllByTenant(request.user.tenantId)
    return chatbots
  }

  async update(
    request: FastifyRequest<{ Params: ChatbotParams; Body: UpdateChatbotDto }>,
    reply: FastifyReply
  ) {
    // Check if chatbot exists and user has access
    const existing = await this.chatbotService.findById(request.params.id)
    if (!existing) {
      return reply.code(404).send({ message: 'Chatbot not found' })
    }

    if (existing.tenantId !== request.user.tenantId) {
      return reply.code(403).send({ message: 'Access denied' })
    }

    const chatbot = await this.chatbotService.update(request.params.id, request.body)
    return chatbot
  }

  async delete(request: FastifyRequest<{ Params: ChatbotParams }>, reply: FastifyReply) {
    // Check if chatbot exists and user has access
    const existing = await this.chatbotService.findById(request.params.id)
    if (!existing) {
      return reply.code(404).send({ message: 'Chatbot not found' })
    }

    if (existing.tenantId !== request.user.tenantId) {
      return reply.code(403).send({ message: 'Access denied' })
    }

    await this.chatbotService.delete(request.params.id)
    return reply.code(204).send()
  }

  async getEmbedScript(request: FastifyRequest<{ Params: ChatbotParams }>, reply: FastifyReply) {
    // Check if chatbot exists and user has access
    const chatbot = await this.chatbotService.findById(request.params.id)
    if (!chatbot) {
      return reply.code(404).send({ message: 'Chatbot not found' })
    }

    if (chatbot.tenantId !== request.user.tenantId) {
      return reply.code(403).send({ message: 'Access denied' })
    }

    const script = await this.chatbotService.generateEmbedScript(request.params.id)
    return { script }
  }
}
