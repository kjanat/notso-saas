import { AggregateRoot } from '../base/entity.base.js'
import { ChatbotId } from '../value-objects/chatbot-id.value-object.js'
import { TenantId } from '../value-objects/tenant-id.value-object.js'
import { EmbedId } from '../value-objects/embed-id.value-object.js'

export interface AvatarConfiguration {
  modelUrl: string
  scale: number
  position: { x: number; y: number; z: number }
  animationMap: Record<string, string>
}

export interface PersonalityConfiguration {
  traits: string
  voiceTone: string
  responseStyle: string
  systemPrompt: string
}

export interface BehaviorConfiguration {
  greetingDelay: number
  idleAnimationInterval: number
  lookAtCursor: boolean
  respondToScroll: boolean
  proximityReactions: boolean
}

export interface PlacementConfiguration {
  pages: string[]
  position: string
  mobilePosition: string
  zIndex: number
}

export interface ChatbotProps {
  tenantId: TenantId
  embedId: EmbedId
  name: string
  purpose: 'sales' | 'support' | 'onboarding' | 'general'
  avatar: AvatarConfiguration
  personality: PersonalityConfiguration
  behavior: BehaviorConfiguration
  placement: PlacementConfiguration
  aiModel: string
  temperature: number
  knowledgeBaseId?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class Chatbot extends AggregateRoot<ChatbotProps> {
  private constructor(props: ChatbotProps, id: ChatbotId) {
    super(props, id.value)
  }

  static create(
    tenantId: string,
    name: string,
    purpose: 'sales' | 'support' | 'onboarding' | 'general',
    avatarConfig: AvatarConfiguration,
    personalityConfig: PersonalityConfiguration
  ): Chatbot {
    const chatbotId = ChatbotId.create()
    const embedId = EmbedId.generate()

    const chatbot = new Chatbot(
      {
        tenantId: TenantId.create(tenantId),
        embedId,
        name,
        purpose,
        avatar: avatarConfig,
        personality: personalityConfig,
        behavior: {
          greetingDelay: 3000,
          idleAnimationInterval: 15000,
          lookAtCursor: true,
          respondToScroll: true,
          proximityReactions: true,
        },
        placement: {
          pages: ['/*'],
          position: 'bottom-right',
          mobilePosition: 'bottom-center',
          zIndex: 9999,
        },
        aiModel: 'gpt-4',
        temperature: 0.7,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      chatbotId
    )

    chatbot.addDomainEvent({
      aggregateId: chatbot.id,
      eventName: 'ChatbotCreated',
      occurredOn: new Date(),
      payload: {
        tenantId,
        name,
        purpose,
        embedId: embedId.value,
      },
    })

    return chatbot
  }

  static reconstitute(
    id: string,
    props: {
      tenantId: string
      embedId: string
      name: string
      purpose: 'sales' | 'support' | 'onboarding' | 'general'
      avatar: AvatarConfiguration
      personality: PersonalityConfiguration
      behavior: BehaviorConfiguration
      placement: PlacementConfiguration
      aiModel: string
      temperature: number
      knowledgeBaseId?: string
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }
  ): Chatbot {
    return new Chatbot(
      {
        tenantId: TenantId.create(props.tenantId),
        embedId: EmbedId.create(props.embedId),
        name: props.name,
        purpose: props.purpose,
        avatar: props.avatar,
        personality: props.personality,
        behavior: props.behavior,
        placement: props.placement,
        aiModel: props.aiModel,
        temperature: props.temperature,
        knowledgeBaseId: props.knowledgeBaseId,
        isActive: props.isActive,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      ChatbotId.create(id)
    )
  }

  get tenantId(): string {
    return this.props.tenantId.value
  }

  get embedId(): string {
    return this.props.embedId.value
  }

  get name(): string {
    return this.props.name
  }

  get purpose(): string {
    return this.props.purpose
  }

  get embedScriptUrl(): string {
    return `/embed/${this.props.embedId.value}.js`
  }

  updateAvatar(config: Partial<AvatarConfiguration>): void {
    this.props.avatar = { ...this.props.avatar, ...config }
    this.props.updatedAt = new Date()

    this.addDomainEvent({
      aggregateId: this.id,
      eventName: 'ChatbotAvatarUpdated',
      occurredOn: new Date(),
      payload: {
        chatbotId: this.id,
        avatarConfig: config,
      },
    })
  }

  updatePersonality(config: Partial<PersonalityConfiguration>): void {
    this.props.personality = { ...this.props.personality, ...config }
    this.props.updatedAt = new Date()

    this.addDomainEvent({
      aggregateId: this.id,
      eventName: 'ChatbotPersonalityUpdated',
      occurredOn: new Date(),
      payload: {
        chatbotId: this.id,
        personalityConfig: config,
      },
    })
  }

  updateBehavior(config: Partial<BehaviorConfiguration>): void {
    this.props.behavior = { ...this.props.behavior, ...config }
    this.props.updatedAt = new Date()
  }

  updatePlacement(config: Partial<PlacementConfiguration>): void {
    this.props.placement = { ...this.props.placement, ...config }
    this.props.updatedAt = new Date()
  }

  attachKnowledgeBase(knowledgeBaseId: string): void {
    this.props.knowledgeBaseId = knowledgeBaseId
    this.props.updatedAt = new Date()

    this.addDomainEvent({
      aggregateId: this.id,
      eventName: 'KnowledgeBaseAttached',
      occurredOn: new Date(),
      payload: {
        chatbotId: this.id,
        knowledgeBaseId,
      },
    })
  }

  deactivate(): void {
    this.props.isActive = false
    this.props.updatedAt = new Date()

    this.addDomainEvent({
      aggregateId: this.id,
      eventName: 'ChatbotDeactivated',
      occurredOn: new Date(),
      payload: {
        chatbotId: this.id,
      },
    })
  }

  activate(): void {
    this.props.isActive = true
    this.props.updatedAt = new Date()

    this.addDomainEvent({
      aggregateId: this.id,
      eventName: 'ChatbotActivated',
      occurredOn: new Date(),
      payload: {
        chatbotId: this.id,
      },
    })
  }
}
