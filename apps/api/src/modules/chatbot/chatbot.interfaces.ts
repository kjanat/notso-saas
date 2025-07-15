import type { Chatbot } from '../../domain/entities/chatbot.entity.js'
import type { IBaseRepository } from '../../shared/interfaces/base.interfaces.js'

export interface CreateChatbotDto {
  tenantId: string
  name: string
  purpose?: 'sales' | 'support' | 'onboarding' | 'general'
  description?: string
  welcomeMessage?: string
  theme?: Record<string, any>
  avatar?: {
    modelUrl: string
    scale?: number
    position?: { x: number; y: number; z: number }
    animationMap?: Record<string, string>
  }
  personality?: {
    traits?: string
    voiceTone?: string
    responseStyle?: string
    systemPrompt?: string
  }
  behavior?: {
    greetingDelay?: number
    idleAnimationInterval?: number
    lookAtCursor?: boolean
    respondToScroll?: boolean
    proximityReactions?: boolean
  }
  placement?: {
    pages?: string[]
    position?: string
    mobilePosition?: string
    zIndex?: number
  }
  aiModel?: string
  temperature?: number
  knowledgeBaseId?: string
}

export type UpdateChatbotDto = Partial<CreateChatbotDto>

export interface IChatbotRepository
  extends IBaseRepository<Chatbot, CreateChatbotDto, UpdateChatbotDto> {
  findByEmbedId(embedId: string): Promise<Chatbot | null>
  findAllByTenant(tenantId: string): Promise<Chatbot[]>
  generateDeploymentKey(): string
}

export interface IChatbotService {
  create(data: CreateChatbotDto): Promise<Chatbot>
  findById(id: string): Promise<Chatbot | null>
  findByEmbedId(embedId: string): Promise<Chatbot | null>
  findAllByTenant(tenantId: string): Promise<Chatbot[]>
  update(id: string, data: UpdateChatbotDto): Promise<Chatbot>
  delete(id: string): Promise<void>
  generateEmbedScript(chatbotId: string): Promise<string>
}
