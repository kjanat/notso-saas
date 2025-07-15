import { BaseEntity } from './base.entity.js'

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  ARCHIVED = 'ARCHIVED',
}

export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  model?: string
  promptTokens?: number
  completionTokens?: number
  totalCost?: number
  latencyMs?: number
  sentiment?: string
  triggeredAnimation?: string
  timestamp: Date
}

export class Conversation extends BaseEntity {
  chatbotId: string
  sessionId: string
  status: ConversationStatus
  userAgent?: string
  pageUrl?: string
  referrer?: string
  startedAt: Date
  endedAt?: Date
  messages: Message[]

  constructor(data: {
    id?: string
    chatbotId: string
    sessionId: string
    status?: ConversationStatus
    userAgent?: string
    pageUrl?: string
    referrer?: string
    startedAt?: Date
    endedAt?: Date
    messages?: Message[]
    createdAt?: Date
    updatedAt?: Date
  }) {
    super({ createdAt: data.createdAt, id: data.id, updatedAt: data.updatedAt })
    this.chatbotId = data.chatbotId
    this.sessionId = data.sessionId
    this.status = data.status || ConversationStatus.ACTIVE
    this.userAgent = data.userAgent
    this.pageUrl = data.pageUrl
    this.referrer = data.referrer
    this.startedAt = data.startedAt || new Date()
    this.endedAt = data.endedAt
    this.messages = data.messages || []
  }

  endConversation(): void {
    if (this.status === ConversationStatus.ENDED) {
      throw new Error('Conversation is already ended')
    }
    this.status = ConversationStatus.ENDED
    this.endedAt = new Date()
    this.markUpdated()
  }

  archive(): void {
    if (this.status !== ConversationStatus.ENDED) {
      throw new Error('Can only archive ended conversations')
    }
    this.status = ConversationStatus.ARCHIVED
    this.markUpdated()
  }

  addMessage(message: Omit<Message, 'id' | 'conversationId' | 'timestamp'>): Message {
    const newMessage: Message = {
      ...message,
      conversationId: this.id,
      id: this.generateId(),
      timestamp: new Date(),
    }
    this.messages.push(newMessage)
    this.markUpdated()
    return newMessage
  }

  getMessageCount(): number {
    return this.messages.length
  }

  getDuration(): number | null {
    if (!this.endedAt) return null
    return this.endedAt.getTime() - this.startedAt.getTime()
  }

  getTotalTokens(): number {
    return this.messages.reduce((total, msg) => {
      return total + (msg.promptTokens || 0) + (msg.completionTokens || 0)
    }, 0)
  }

  getTotalCost(): number {
    return this.messages.reduce((total, msg) => total + (msg.totalCost || 0), 0)
  }
}
