import { AggregateRoot } from '../base/entity.base.js'
import { ChatbotId } from '../value-objects/chatbot-id.value-object.js'
import { EmbedId } from '../value-objects/embed-id.value-object.js'
import { TenantId } from '../value-objects/tenant-id.value-object.js'

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
        aiModel: 'gpt-4',
        avatar: avatarConfig,
        behavior: {
          greetingDelay: 3000,
          idleAnimationInterval: 15000,
          lookAtCursor: true,
          proximityReactions: true,
          respondToScroll: true,
        },
        createdAt: new Date(),
        embedId,
        isActive: true,
        name,
        personality: personalityConfig,
        placement: {
          mobilePosition: 'bottom-center',
          pages: ['/*'],
          position: 'bottom-right',
          zIndex: 9999,
        },
        purpose,
        temperature: 0.7,
        tenantId: TenantId.create(tenantId),
        updatedAt: new Date(),
      },
      chatbotId
    )

    chatbot.addDomainEvent({
      aggregateId: chatbot.id,
      eventName: 'ChatbotCreated',
      occurredOn: new Date(),
      payload: {
        embedId: embedId.value,
        name,
        purpose,
        tenantId,
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
      welcomeMessage?: string
      theme?: Record<string, any>
      description?: string
    }
  ): Chatbot {
    return new Chatbot(
      {
        aiModel: props.aiModel,
        avatar: props.avatar,
        behavior: props.behavior,
        createdAt: props.createdAt,
        embedId: EmbedId.create(props.embedId),
        isActive: props.isActive,
        knowledgeBaseId: props.knowledgeBaseId,
        name: props.name,
        personality: props.personality,
        placement: props.placement,
        purpose: props.purpose,
        temperature: props.temperature,
        tenantId: TenantId.create(props.tenantId),
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

  get avatarModelUrl(): string | undefined {
    return this.props.avatar?.modelUrl
  }

  get avatarScale(): number {
    return this.props.avatar?.scale || 1
  }

  get avatarPosition(): { x: number; y: number; z: number } {
    return this.props.avatar?.position || { x: 0, y: -0.5, z: 0 }
  }

  get animationMap(): Record<string, string> {
    return this.props.avatar?.animationMap || {}
  }

  get systemPrompt(): string {
    return this.props.personality?.systemPrompt || 'You are a helpful assistant.'
  }

  get welcomeMessage(): string | undefined {
    return this.props.personality?.traits
  }

  get model(): string {
    return this.props.aiModel
  }

  get temperature(): number {
    return this.props.temperature
  }

  get maxTokens(): number | undefined {
    return undefined // Not defined in the current model
  }

  get knowledgeBaseId(): string | undefined {
    return this.props.knowledgeBaseId
  }

  get placement(): PlacementConfiguration {
    return this.props.placement
  }

  get behaviors(): BehaviorConfiguration {
    return this.props.behavior
  }

  get theme():
    | { primaryColor?: string; secondaryColor?: string; fontFamily?: string; borderRadius?: string }
    | undefined {
    return undefined // Not defined in the current model
  }

  updateAvatar(config: Partial<AvatarConfiguration>): void {
    this.props.avatar = { ...this.props.avatar, ...config }
    this.props.updatedAt = new Date()

    this.addDomainEvent({
      aggregateId: this.id,
      eventName: 'ChatbotAvatarUpdated',
      occurredOn: new Date(),
      payload: {
        avatarConfig: config,
        chatbotId: this.id,
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
