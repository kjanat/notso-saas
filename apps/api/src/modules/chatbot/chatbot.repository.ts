import { injectable } from 'tsyringe'

import { Chatbot } from '../../domain/entities/chatbot.entity.js'
import { DeploymentKey } from '../../domain/value-objects/deployment-key.value-object.js'
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
    const deploymentKey = this.generateDeploymentKey()
    const slug = data.name.toLowerCase().replace(/\s+/g, '-')

    const chatbot = await this.db.chatbot.create({
      data: {
        appearance: data.theme || {},
        avatarUrl: data.avatar?.modelUrl,
        behavior: data.behavior || {
          greetingDelay: 3000,
          idleAnimationInterval: 15000,
          lookAtCursor: true,
          proximityReactions: true,
          respondToScroll: true,
        },
        deploymentKey,
        description: data.description,
        isActive: true,
        knowledgeBase: data.knowledgeBaseId ? [data.knowledgeBaseId] : [],
        maxTokens: 500,
        metadata: {},
        model: data.aiModel || 'gpt-4',
        name: data.name,
        placement: data.placement || {
          mobilePosition: 'bottom-center',
          pages: ['/*'],
          position: 'bottom-right',
          zIndex: 9999,
        },
        provider: 'OPENAI', // Default to OpenAI for now
        purpose: data.purpose ? (data.purpose.toUpperCase() as any) : 'GENERAL',
        responseTimeout: 30000,
        settings: {
          avatar: data.avatar || {},
          personality: data.personality || {},
        },
        slug,
        systemPrompt: data.personality?.systemPrompt || 'You are a helpful assistant.',
        temperature: data.temperature || 0.7,
        tenantId: data.tenantId,
        welcomeMessage: data.welcomeMessage,
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
      where: { deploymentKey: embedId },
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
    const updateData: any = {}

    if (data.name) updateData.name = data.name
    if (data.description) updateData.description = data.description
    if (data.welcomeMessage) updateData.welcomeMessage = data.welcomeMessage
    if (data.aiModel) updateData.model = data.aiModel
    if (data.temperature !== undefined) updateData.temperature = data.temperature
    if (data.purpose) updateData.purpose = data.purpose.toUpperCase()
    if (data.avatar?.modelUrl) updateData.avatarUrl = data.avatar.modelUrl
    if (data.personality?.systemPrompt) updateData.systemPrompt = data.personality.systemPrompt

    // Complex objects stored as JSON
    if (data.avatar) updateData.settings = { ...updateData.settings, avatar: data.avatar }
    if (data.personality)
      updateData.settings = { ...updateData.settings, personality: data.personality }
    if (data.behavior) updateData.behavior = data.behavior
    if (data.placement) updateData.placement = data.placement
    if (data.theme) updateData.appearance = data.theme
    if (data.knowledgeBaseId !== undefined) {
      updateData.knowledgeBase = data.knowledgeBaseId ? [data.knowledgeBaseId] : []
    }

    const chatbot = await this.db.chatbot.update({
      data: updateData,
      where: { id },
    })

    return this.toDomain(chatbot)
  }

  async delete(id: string): Promise<void> {
    await this.db.chatbot.delete({
      where: { id },
    })
  }

  generateDeploymentKey(): string {
    return DeploymentKey.generate().value
  }

  private toDomain(data: any): Chatbot {
    const settings = data.settings || {}
    const personality = settings.personality || {}
    const avatar = settings.avatar || {}

    return Chatbot.reconstitute(data.id, {
      aiModel: data.model || 'gpt-4',
      avatar: {
        animationMap: avatar.animationMap || {},
        modelUrl: data.avatarUrl || '',
        position: avatar.position || { x: 0, y: -0.5, z: 0 },
        scale: avatar.scale || 1,
      },
      behavior: data.behavior || {
        greetingDelay: 3000,
        idleAnimationInterval: 15000,
        lookAtCursor: true,
        proximityReactions: true,
        respondToScroll: true,
      },
      createdAt: data.createdAt,
      description: data.description,
      embedId: data.deploymentKey,
      isActive: data.isActive ?? true,
      knowledgeBaseId:
        Array.isArray(data.knowledgeBase) && data.knowledgeBase.length > 0
          ? data.knowledgeBase[0]
          : null,
      name: data.name,
      personality: {
        responseStyle: personality.responseStyle || 'concise',
        systemPrompt: data.systemPrompt || 'You are a helpful assistant.',
        traits: personality.traits || 'friendly, helpful',
        voiceTone: personality.voiceTone || 'professional',
      },
      placement: data.placement || {
        mobilePosition: 'bottom-center',
        pages: ['/*'],
        position: 'bottom-right',
        zIndex: 9999,
      },
      purpose: data.purpose ? data.purpose.toLowerCase() : 'general',
      temperature: data.temperature || 0.7,
      tenantId: data.tenantId,
      theme: data.appearance || {},
      updatedAt: data.updatedAt,
      welcomeMessage: data.welcomeMessage,
    })
  }
}
