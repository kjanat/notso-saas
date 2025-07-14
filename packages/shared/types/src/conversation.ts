/**
 * Conversation and messaging types
 */

import type { BaseEntity, ChatbotId, ConversationId, MessageId, TenantId, UserId } from './base'

export interface Conversation extends BaseEntity {
  id: ConversationId
  tenantId: TenantId
  chatbotId: ChatbotId
  visitorId: string
  visitorMetadata: VisitorMetadata
  startedAt: Date
  endedAt?: Date
  status: ConversationStatus
  sentimentScore?: number
  tags: string[]
  metadata: Record<string, any>
  summary?: string
}

export type ConversationStatus = 'active' | 'ended' | 'abandoned' | 'transferred'

export interface VisitorMetadata {
  id: string
  ipAddress?: string
  userAgent?: string
  location?: {
    country?: string
    city?: string
    region?: string
  }
  referrer?: string
  currentPage?: string
  sessionId?: string
  userId?: UserId // If visitor is authenticated
  customAttributes?: Record<string, any>
}

export interface Message extends BaseEntity {
  id: MessageId
  conversationId: ConversationId
  sender: MessageSender
  senderId: string
  content: string
  type: MessageType
  sentimentScore?: number
  intentClassification?: IntentClassification
  attachments?: MessageAttachment[]
  metadata: Record<string, any>
}

export type MessageSender = 'visitor' | 'bot' | 'agent'
export type MessageType = 'text' | 'image' | 'file' | 'system' | 'card' | 'quick-reply'

export interface MessageAttachment {
  id: string
  type: 'image' | 'file' | 'video' | 'audio'
  name: string
  url: string
  size: number
  mimeType: string
}

export interface IntentClassification {
  intent: string
  confidence: number
  entities?: Array<{
    type: string
    value: string
    confidence: number
  }>
}

export interface ConversationMetrics {
  conversationId: ConversationId
  duration: number
  messageCount: number
  visitorMessageCount: number
  botMessageCount: number
  averageResponseTime: number
  sentimentTrend: Array<{
    timestamp: Date
    score: number
  }>
  resolutionStatus?: 'resolved' | 'unresolved' | 'escalated'
  customerSatisfaction?: number
}

// Real-time events
export interface ConversationEvent {
  type: ConversationEventType
  conversationId: ConversationId
  timestamp: Date
  data: any
}

export type ConversationEventType =
  | 'conversation.started'
  | 'conversation.ended'
  | 'message.sent'
  | 'message.received'
  | 'typing.start'
  | 'typing.stop'
  | 'visitor.inactive'
  | 'agent.joined'
  | 'agent.left'
