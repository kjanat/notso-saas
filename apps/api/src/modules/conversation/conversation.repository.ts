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
        metadata: {
          pageUrl: data.pageUrl,
          referrer: data.referrer,
          userAgent: data.userAgent,
        },
        sessionId: data.sessionId,
        startedAt: new Date(),
        status: ConversationStatus.ACTIVE,
      },
      include: {
        messages: true,
      },
    })

    return this.toDomain({
      ...conversation,
      createdAt: conversation.startedAt,
      pageUrl: null,
      referrer: null,
      updatedAt: conversation.lastActivityAt,
      userAgent: null,
    })
  }

  async findById(id: string): Promise<Conversation | null> {
    const conversation = await this.db.conversation.findUnique({
      include: {
        messages: true,
      },
      where: { id },
    })

    return conversation
      ? this.toDomain({
          ...conversation,
          createdAt: conversation.startedAt,
          pageUrl: null,
          referrer: null,
          updatedAt: conversation.lastActivityAt,
          userAgent: null,
        })
      : null
  }

  async findBySessionId(sessionId: string): Promise<Conversation | null> {
    const conversation = await this.db.conversation.findFirst({
      include: {
        messages: true,
      },
      orderBy: { startedAt: 'desc' },
      where: { sessionId },
    })

    return conversation
      ? this.toDomain({
          ...conversation,
          createdAt: conversation.startedAt,
          pageUrl: null,
          referrer: null,
          updatedAt: conversation.lastActivityAt,
          userAgent: null,
        })
      : null
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

    return conversation
      ? this.toDomain({
          ...conversation,
          createdAt: conversation.startedAt,
          pageUrl: null,
          referrer: null,
          updatedAt: conversation.lastActivityAt,
          userAgent: null,
        })
      : null
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

    return conversations.map(conv =>
      this.toDomain({
        ...conv,
        createdAt: conv.startedAt,
        messages: conv.messages || [],
        pageUrl: null,
        referrer: null,
        updatedAt: conv.lastActivityAt,
        userAgent: null,
      })
    )
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

    return conversations.map(conv =>
      this.toDomain({
        ...conv,
        createdAt: conv.startedAt,
        messages: conv.messages || [],
        pageUrl: null,
        referrer: null,
        updatedAt: conv.lastActivityAt,
        userAgent: null,
      })
    )
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

    return this.toDomain({
      ...conversation,
      createdAt: conversation.startedAt,
      pageUrl: null,
      referrer: null,
      updatedAt: conversation.lastActivityAt,
      userAgent: null,
    })
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
        cost: message.totalCost,
        latencyMs: message.latencyMs,
        model: message.model,
        promptTokens: message.promptTokens,
        role: message.role,
        sentiment: message.sentiment ? Number.parseFloat(message.sentiment) : null,
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
      role: newMessage.role as any,
      sentiment: newMessage.sentiment ? newMessage.sentiment.toString() : undefined,
      timestamp: newMessage.createdAt,
      totalCost: newMessage.cost || undefined,
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
      totalTokens?: number | null
      cost?: number | null
      latencyMs?: number | null
      sentiment?: number | null
      triggeredAnimation?: string | null
      createdAt: Date
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
      role: msg.role as any,
      sentiment: msg.sentiment ? msg.sentiment.toString() : undefined,
      timestamp: msg.createdAt,
      totalCost: msg.cost || undefined,
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
