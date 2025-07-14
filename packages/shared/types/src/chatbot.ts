/**
 * Chatbot-related types and interfaces
 */

import type { BaseEntity, ChatbotId, TenantId, DeploymentKey } from './base'

export interface Chatbot extends BaseEntity {
  id: ChatbotId
  tenantId: TenantId
  name: string
  slug: string
  deploymentKey: DeploymentKey
  isActive: boolean
  avatarConfig: AvatarConfiguration
  personalityConfig: PersonalityConfiguration
  knowledgeBase: KnowledgeBaseItem[]
  widgetConfig: WidgetConfiguration
  metadata: Record<string, any>
}

export interface AvatarConfiguration {
  modelId?: string
  modelUrl?: string
  animations: AvatarAnimation[]
  customization: {
    skinTone?: string
    hairStyle?: string
    clothing?: string
    accessories?: string[]
  }
  voice?: {
    provider: 'elevenlabs' | 'google' | 'amazon'
    voiceId: string
    pitch?: number
    speed?: number
  }
}

export interface AvatarAnimation {
  name: string
  trigger: 'greeting' | 'thinking' | 'speaking' | 'idle' | 'goodbye'
  animationUrl?: string
  duration: number
}

export interface PersonalityConfiguration {
  name: string
  role: string
  personality: string
  tone: 'formal' | 'casual' | 'friendly' | 'professional'
  language: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  welcomeMessage: string
  fallbackResponses: string[]
  prohibitedTopics?: string[]
}

export interface KnowledgeBaseItem {
  id: string
  type: 'faq' | 'document' | 'website' | 'api'
  title: string
  content: string
  url?: string
  metadata?: Record<string, any>
  lastUpdated: Date
}

export interface WidgetConfiguration {
  theme: {
    primaryColor: string
    textColor: string
    backgroundColor: string
    fontFamily?: string
  }
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  size: 'small' | 'medium' | 'large'
  autoOpen: boolean
  autoOpenDelay?: number
  showAvatar: boolean
  showTypingIndicator: boolean
  allowFileUploads: boolean
  allowedFileTypes?: string[]
  customCSS?: string
}

export interface ChatbotDeployment {
  chatbotId: ChatbotId
  deploymentKey: DeploymentKey
  allowedDomains: string[]
  rateLimit?: {
    messagesPerMinute: number
    messagesPerHour: number
  }
  analytics: {
    trackPageViews: boolean
    trackEvents: boolean
    customEvents?: string[]
  }
}