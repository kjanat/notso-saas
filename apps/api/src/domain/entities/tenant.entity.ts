import { AggregateRoot } from '../base/entity.base.js'
import { ApiKey } from '../value-objects/api-key.value-object.js'
import { SubscriptionPlan } from '../value-objects/subscription-plan.value-object.js'
import { TenantId } from '../value-objects/tenant-id.value-object.js'
import { TenantName } from '../value-objects/tenant-name.value-object.js'
import { TenantSlug } from '../value-objects/tenant-slug.value-object.js'

export interface TenantProps {
  name: TenantName
  slug: TenantSlug
  apiKey: ApiKey
  subscriptionPlan: SubscriptionPlan
  maxChatbots: number
  currentChatbots: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class Tenant extends AggregateRoot<TenantProps> {
  private constructor(props: TenantProps, id: TenantId) {
    super(props, id.value)
  }

  static create(name: string, slug: string, apiKey: string, plan = 'free'): Tenant {
    const tenantId = TenantId.create()
    const tenantName = TenantName.create(name)
    const tenantSlug = TenantSlug.create(slug)
    const apiKeyVO = ApiKey.create(apiKey)
    const subscriptionPlan = SubscriptionPlan.create(plan)

    const tenant = new Tenant(
      {
        apiKey: apiKeyVO,
        createdAt: new Date(),
        currentChatbots: 0,
        isActive: true,
        maxChatbots: subscriptionPlan.maxChatbots,
        name: tenantName,
        slug: tenantSlug,
        subscriptionPlan,
        updatedAt: new Date(),
      },
      tenantId
    )

    tenant.addDomainEvent({
      aggregateId: tenant.id,
      eventName: 'TenantCreated',
      occurredOn: new Date(),
      payload: {
        name: name,
        plan: plan,
        slug: slug,
      },
    })

    return tenant
  }

  static reconstitute(
    id: string,
    props: {
      name: string
      slug: string
      apiKey: string
      subscriptionPlan: string
      maxChatbots: number
      currentChatbots: number
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }
  ): Tenant {
    return new Tenant(
      {
        apiKey: ApiKey.create(props.apiKey),
        createdAt: props.createdAt,
        currentChatbots: props.currentChatbots,
        isActive: props.isActive,
        maxChatbots: props.maxChatbots,
        name: TenantName.create(props.name),
        slug: TenantSlug.create(props.slug),
        subscriptionPlan: SubscriptionPlan.create(props.subscriptionPlan),
        updatedAt: props.updatedAt,
      },
      TenantId.create(id)
    )
  }

  get name(): string {
    return this.props.name.value
  }

  get slug(): string {
    return this.props.slug.value
  }

  get apiKey(): string {
    return this.props.apiKey.value
  }

  get subscriptionPlan(): string {
    return this.props.subscriptionPlan.name
  }

  get maxChatbots(): number {
    return this.props.maxChatbots
  }

  get currentChatbots(): number {
    return this.props.currentChatbots
  }

  get isActive(): boolean {
    return this.props.isActive
  }

  canCreateChatbot(): boolean {
    return this.props.currentChatbots < this.props.maxChatbots && this.props.isActive
  }

  incrementChatbotCount(): void {
    if (!this.canCreateChatbot()) {
      throw new Error('Cannot create more chatbots. Limit reached or tenant inactive.')
    }

    this.props.currentChatbots++
    this.props.updatedAt = new Date()

    this.addDomainEvent({
      aggregateId: this.id,
      eventName: 'ChatbotCreated',
      occurredOn: new Date(),
      payload: {
        currentCount: this.props.currentChatbots,
        maxCount: this.props.maxChatbots,
      },
    })
  }

  updateSubscription(plan: string): void {
    const newPlan = SubscriptionPlan.create(plan)
    const oldPlan = this.props.subscriptionPlan.name

    this.props.subscriptionPlan = newPlan
    this.props.maxChatbots = newPlan.maxChatbots
    this.props.updatedAt = new Date()

    this.addDomainEvent({
      aggregateId: this.id,
      eventName: 'SubscriptionUpdated',
      occurredOn: new Date(),
      payload: {
        newMaxChatbots: newPlan.maxChatbots,
        newPlan: plan,
        oldPlan,
      },
    })
  }

  deactivate(): void {
    this.props.isActive = false
    this.props.updatedAt = new Date()

    this.addDomainEvent({
      aggregateId: this.id,
      eventName: 'TenantDeactivated',
      occurredOn: new Date(),
      payload: {
        tenantId: this.id,
      },
    })
  }

  regenerateApiKey(): string {
    const newApiKey = ApiKey.generate()
    this.props.apiKey = newApiKey
    this.props.updatedAt = new Date()

    this.addDomainEvent({
      aggregateId: this.id,
      eventName: 'ApiKeyRegenerated',
      occurredOn: new Date(),
      payload: {
        tenantId: this.id,
      },
    })

    return newApiKey.value
  }
}
