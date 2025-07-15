import { injectable } from 'tsyringe'

import { Chatbot } from '../../domain/entities/chatbot.entity.js'
import { EmbedId } from '../../domain/value-objects/embed-id.value-object.js'
import { getDatabase } from '../../shared/database/index.js'

import type {
  CreateChatbotDto,
  IChatbotRepository,
  UpdateChatbotDto,
} from './chatbot.interfaces.js'

@injectable()
export class ChatbotRepository implements IChatbotRepository {
  private get db() {
    return getDatabase()
  }

  async create(data: CreateChatbotDto): Promise<Chatbot> {
    const embedId = this.generateEmbedId()

    const chatbot = await this.db.chatbot.create({
      data: {
        animationMap: data.avatar?.animationMap || {},
        avatarModelUrl: data.avatar?.modelUrl,
        avatarPosition: data.avatar?.position || { x: 0, y: -0.5, z: 0 },
        avatarScale: data.avatar?.scale || 1,
        behaviors: data.behavior || {
          greetingDelay: 3000,
          idleAnimationInterval: 15000,
          lookAtCursor: true,
          proximityReactions: true,
          respondToScroll: true,
        },
        embedId,
        knowledgeBaseId: data.knowledgeBaseId,
        model: data.aiModel || 'gpt-4',
        name: data.name,
        personalityTraits: data.personality?.traits || 'friendly, helpful',
        placement: data.placement || {
          mobilePosition: 'bottom-center',
          pages: ['/*'],
          position: 'bottom-right',
          zIndex: 9999,
        },
        purpose: data.purpose || 'general',
        responseStyle: data.personality?.responseStyle || 'concise',
        systemPrompt: data.personality?.systemPrompt || 'You are a helpful assistant.',
        temperature: data.temperature || 0.7,
        tenantId: data.tenantId,
        voiceTone: data.personality?.voiceTone || 'professional',
      },
    })

    return this.toDomain(chatbot)
  }

  async findById(id: string): Promise<Chatbot | null> {
    const chatbot = await this.db.chatbot.findUnique({
      where: { id },
    })

    return chatbot ? this.toDomain(chatbot) : null
  }

  async findByEmbedId(embedId: string): Promise<Chatbot | null> {
    const chatbot = await this.db.chatbot.findUnique({
      where: { embedId },
    })

    return chatbot ? this.toDomain(chatbot) : null
  }

  async findAllByTenant(tenantId: string): Promise<Chatbot[]> {
    const chatbots = await this.db.chatbot.findMany({
      orderBy: { createdAt: 'desc' },
      where: { tenantId },
    })

    return chatbots.map(chatbot => this.toDomain(chatbot))
  }

  async findAll(filters?: { tenantId?: string; isActive?: boolean }): Promise<Chatbot[]> {
    const chatbots = await this.db.chatbot.findMany({
      orderBy: { createdAt: 'desc' },
      where: filters,
    })

    return chatbots.map(chatbot => this.toDomain(chatbot))
  }

  async count(filters?: { tenantId?: string; isActive?: boolean }): Promise<number> {
    return this.db.chatbot.count({
      where: filters,
    })
  }

  async update(id: string, data: UpdateChatbotDto): Promise<Chatbot> {
    const chatbot = await this.db.chatbot.update({
      data,
      where: { id },
    })

    return this.toDomain(chatbot)
  }

  async delete(id: string): Promise<void> {
    await this.db.chatbot.delete({
      where: { id },
    })
  }

  generateEmbedId(): string {
    return EmbedId.generate().value
  }

  private toDomain(data: {
    id: string
    tenantId: string
    embedId: string
    name: string
    purpose?: string | null
    avatarModelUrl?: string | null
    avatarScale?: number | null
    avatarPosition?: unknown
    animationMap?: unknown
    personalityTraits?: string | null
    voiceTone?: string | null
    responseStyle?: string | null
    systemPrompt?: string | null
    behaviors?: unknown
    placement?: unknown
    model?: string | null
    temperature?: number | null
    knowledgeBaseId?: string | null
    isActive?: boolean
    createdAt: Date
    updatedAt: Date
  }): Chatbot {
    return Chatbot.reconstitute(data.id, {
      aiModel: data.model || 'gpt-4',
      avatar: {
        animationMap: data.animationMap || {},
        modelUrl: data.avatarModelUrl || '',
        position: data.avatarPosition || { x: 0, y: -0.5, z: 0 },
        scale: data.avatarScale || 1,
      },
      behavior: data.behaviors || {
        greetingDelay: 3000,
        idleAnimationInterval: 15000,
        lookAtCursor: true,
        proximityReactions: true,
        respondToScroll: true,
      },
      createdAt: data.createdAt,
      embedId: data.embedId,
      isActive: data.isActive ?? true,
      knowledgeBaseId: data.knowledgeBaseId,
      name: data.name,
      personality: {
        responseStyle: data.responseStyle || 'concise',
        systemPrompt: data.systemPrompt || 'You are a helpful assistant.',
        traits: data.personalityTraits || 'friendly, helpful',
        voiceTone: data.voiceTone || 'professional',
      },
      placement: data.placement || {
        mobilePosition: 'bottom-center',
        pages: ['/*'],
        position: 'bottom-right',
        zIndex: 9999,
      },
      purpose: data.purpose || 'general',
      temperature: data.temperature || 0.7,
      tenantId: data.tenantId,
      updatedAt: data.updatedAt,
    })
  }
}
