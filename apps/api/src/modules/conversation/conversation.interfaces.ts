import type {
  Conversation,
  ConversationStatus,
  Message,
} from '../../domain/entities/conversation.entity.js'
import type { IBaseRepository } from '../../shared/interfaces/base.interfaces.js'

export interface CreateConversationDto {
  chatbotId: string
  sessionId: string
  userAgent?: string
  pageUrl?: string
  referrer?: string
}

export interface UpdateConversationDto {
  status?: ConversationStatus
  endedAt?: Date
}

export interface CreateMessageDto {
  conversationId: string
  role: 'USER' | 'ASSISTANT' | 'SYSTEM'
  content: string
  model?: string
  promptTokens?: number
  completionTokens?: number
  totalCost?: number
  latencyMs?: number
  sentiment?: string
  triggeredAnimation?: string
}

export interface IConversationRepository
  extends IBaseRepository<Conversation, CreateConversationDto, UpdateConversationDto> {
  findBySessionId(sessionId: string): Promise<Conversation | null>
  findActiveBySession(sessionId: string, chatbotId: string): Promise<Conversation | null>
  findByChatbot(
    chatbotId: string,
    filters?: { status?: ConversationStatus; limit?: number }
  ): Promise<Conversation[]>
  addMessage(
    conversationId: string,
    message: Omit<Message, 'id' | 'conversationId' | 'timestamp'>
  ): Promise<Message>
}

export interface IConversationService {
  startConversation(data: CreateConversationDto): Promise<Conversation>
  findById(id: string): Promise<Conversation | null>
  findActiveBySession(sessionId: string, chatbotId: string): Promise<Conversation | null>
  findByChatbot(
    chatbotId: string,
    filters?: { status?: ConversationStatus; limit?: number }
  ): Promise<Conversation[]>
  endConversation(id: string): Promise<Conversation>
  archiveConversation(id: string): Promise<Conversation>
  addMessage(
    conversationId: string,
    message: Omit<Message, 'id' | 'conversationId' | 'timestamp'>
  ): Promise<Message>
  getConversationStats(
    chatbotId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalConversations: number
    activeConversations: number
    averageDuration: number
    averageMessageCount: number
    totalTokensUsed: number
    totalCost: number
  }>
}
