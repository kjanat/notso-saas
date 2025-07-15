import { injectable } from 'tsyringe'

import {
  Conversation,
  ConversationStatus,
  type Message,
} from '../../domain/entities/conversation.entity.js'
import { getDatabase } from '../../shared/database/index.js'

import type {
  CreateConversationDto,
  IConversationRepository,
  UpdateConversationDto,
} from './conversation.interfaces.js'

@injectable()
export class ConversationRepository implements IConversationRepository {
  private get db() {
    return getDatabase()
  }

  async create(data: CreateConversationDto): Promise<Conversation> {
    const conversation = await this.db.conversation.create({
      data: {
        chatbotId: data.chatbotId,
        pageUrl: data.pageUrl,
        referrer: data.referrer,
        sessionId: data.sessionId,
        startedAt: new Date(),
        status: ConversationStatus.ACTIVE,
        userAgent: data.userAgent,
      },
      include: {
        messages: true,
      },
    })

    return this.toDomain(conversation)
  }

  async findById(id: string): Promise<Conversation | null> {
    const conversation = await this.db.conversation.findUnique({
      include: {
        messages: true,
      },
      where: { id },
    })

    return conversation ? this.toDomain(conversation) : null
  }

  async findBySessionId(sessionId: string): Promise<Conversation | null> {
    const conversation = await this.db.conversation.findFirst({
      include: {
        messages: true,
      },
      orderBy: { startedAt: 'desc' },
      where: { sessionId },
    })

    return conversation ? this.toDomain(conversation) : null
  }

  async findActiveBySession(sessionId: string, chatbotId: string): Promise<Conversation | null> {
    const conversation = await this.db.conversation.findFirst({
      include: {
        messages: true,
      },
      orderBy: { startedAt: 'desc' },
      where: {
        chatbotId,
        sessionId,
        status: ConversationStatus.ACTIVE,
      },
    })

    return conversation ? this.toDomain(conversation) : null
  }

  async findByChatbot(
    chatbotId: string,
    filters?: { status?: ConversationStatus; limit?: number }
  ): Promise<Conversation[]> {
    const conversations = await this.db.conversation.findMany({
      include: {
        messages: true,
      },
      orderBy: { startedAt: 'desc' },
      take: filters?.limit || 50,
      where: {
        chatbotId,
        ...(filters?.status && { status: filters.status }),
      },
    })

    return conversations.map(conv => this.toDomain(conv))
  }

  async findAll(filters?: {
    chatbotId?: string
    status?: ConversationStatus
    sessionId?: string
    startedAt?: { gte?: Date; lte?: Date }
  }): Promise<Conversation[]> {
    const conversations = await this.db.conversation.findMany({
      include: {
        messages: true,
      },
      orderBy: { startedAt: 'desc' },
      where: filters,
    })

    return conversations.map(conv => this.toDomain(conv))
  }

  async count(filters?: {
    chatbotId?: string
    status?: ConversationStatus
    sessionId?: string
    startedAt?: { gte?: Date; lte?: Date }
  }): Promise<number> {
    return this.db.conversation.count({
      where: filters,
    })
  }

  async update(id: string, data: UpdateConversationDto): Promise<Conversation> {
    const conversation = await this.db.conversation.update({
      data,
      include: {
        messages: true,
      },
      where: { id },
    })

    return this.toDomain(conversation)
  }

  async delete(id: string): Promise<void> {
    await this.db.conversation.delete({
      where: { id },
    })
  }

  async addMessage(
    conversationId: string,
    message: Omit<Message, 'id' | 'conversationId' | 'timestamp'>
  ): Promise<Message> {
    const newMessage = await this.db.message.create({
      data: {
        completionTokens: message.completionTokens,
        content: message.content,
        conversationId,
        latencyMs: message.latencyMs,
        model: message.model,
        promptTokens: message.promptTokens,
        role: message.role,
        sentiment: message.sentiment,
        totalCost: message.totalCost,
        triggeredAnimation: message.triggeredAnimation,
      },
    })

    return {
      completionTokens: newMessage.completionTokens || undefined,
      content: newMessage.content,
      conversationId: newMessage.conversationId,
      id: newMessage.id,
      latencyMs: newMessage.latencyMs || undefined,
      model: newMessage.model || undefined,
      promptTokens: newMessage.promptTokens || undefined,
      role: newMessage.role as 'USER' | 'ASSISTANT' | 'SYSTEM',
      sentiment: newMessage.sentiment || undefined,
      timestamp: newMessage.timestamp,
      totalCost: newMessage.totalCost ? Number(newMessage.totalCost) : undefined,
      triggeredAnimation: newMessage.triggeredAnimation || undefined,
    }
  }

  private toDomain(data: {
    id: string
    chatbotId: string
    sessionId: string
    status: string
    userAgent?: string | null
    pageUrl?: string | null
    referrer?: string | null
    startedAt: Date
    endedAt?: Date | null
    createdAt: Date
    updatedAt: Date
    messages?: Array<{
      id: string
      conversationId: string
      role: string
      content: string
      model?: string | null
      promptTokens?: number | null
      completionTokens?: number | null
      totalCost?: number | null
      latencyMs?: number | null
      sentiment?: string | null
      triggeredAnimation?: string | null
      timestamp: Date
    }>
  }): Conversation {
    const messages: Message[] = (data.messages || []).map(msg => ({
      completionTokens: msg.completionTokens || undefined,
      content: msg.content,
      conversationId: msg.conversationId,
      id: msg.id,
      latencyMs: msg.latencyMs || undefined,
      model: msg.model || undefined,
      promptTokens: msg.promptTokens || undefined,
      role: msg.role as 'USER' | 'ASSISTANT' | 'SYSTEM',
      sentiment: msg.sentiment || undefined,
      timestamp: msg.timestamp,
      totalCost: msg.totalCost ? Number(msg.totalCost) : undefined,
      triggeredAnimation: msg.triggeredAnimation || undefined,
    }))

    return new Conversation({
      chatbotId: data.chatbotId,
      createdAt: data.createdAt,
      endedAt: data.endedAt || undefined,
      id: data.id,
      messages,
      pageUrl: data.pageUrl || undefined,
      referrer: data.referrer || undefined,
      sessionId: data.sessionId,
      startedAt: data.startedAt,
      status: data.status as ConversationStatus,
      updatedAt: data.updatedAt,
      userAgent: data.userAgent || undefined,
    })
  }
}
