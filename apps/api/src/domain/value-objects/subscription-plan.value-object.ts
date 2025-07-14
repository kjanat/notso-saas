import { ValueObject } from '../base/value-object.base.js'

interface SubscriptionPlanProps {
  name: string
  maxChatbots: number
  maxMessagesPerDay: number
  maxKnowledgeBaseSize: number // in MB
  features: string[]
}

export class SubscriptionPlan extends ValueObject<SubscriptionPlanProps> {
  private static readonly PLANS: Record<string, Omit<SubscriptionPlanProps, 'name'>> = {
    free: {
      maxChatbots: 1,
      maxMessagesPerDay: 100,
      maxKnowledgeBaseSize: 10,
      features: ['basic_avatar', 'basic_analytics'],
    },
    starter: {
      maxChatbots: 5,
      maxMessagesPerDay: 1000,
      maxKnowledgeBaseSize: 100,
      features: ['custom_avatar', 'advanced_analytics', 'custom_branding'],
    },
    professional: {
      maxChatbots: 20,
      maxMessagesPerDay: 10000,
      maxKnowledgeBaseSize: 1000,
      features: [
        'custom_avatar',
        'advanced_analytics',
        'custom_branding',
        'priority_support',
        'api_access',
      ],
    },
    enterprise: {
      maxChatbots: -1, // unlimited
      maxMessagesPerDay: -1, // unlimited
      maxKnowledgeBaseSize: -1, // unlimited
      features: [
        'custom_avatar',
        'advanced_analytics',
        'custom_branding',
        'priority_support',
        'api_access',
        'sla',
        'custom_integrations',
      ],
    },
  }

  get name(): string {
    return this.props.name
  }

  get maxChatbots(): number {
    return this.props.maxChatbots
  }

  get maxMessagesPerDay(): number {
    return this.props.maxMessagesPerDay
  }

  get maxKnowledgeBaseSize(): number {
    return this.props.maxKnowledgeBaseSize
  }

  get features(): string[] {
    return [...this.props.features]
  }

  private constructor(props: SubscriptionPlanProps) {
    super(props)
  }

  static create(planName: string): SubscriptionPlan {
    const plan = this.PLANS[planName.toLowerCase()]

    if (!plan) {
      throw new Error(
        `Invalid subscription plan: ${planName}. Valid plans are: ${Object.keys(this.PLANS).join(', ')}`
      )
    }

    return new SubscriptionPlan({
      name: planName.toLowerCase(),
      ...plan,
    })
  }

  hasFeature(feature: string): boolean {
    return this.props.features.includes(feature)
  }

  canCreateChatbot(currentCount: number): boolean {
    return this.props.maxChatbots === -1 || currentCount < this.props.maxChatbots
  }

  canSendMessage(currentDailyCount: number): boolean {
    return this.props.maxMessagesPerDay === -1 || currentDailyCount < this.props.maxMessagesPerDay
  }
}
