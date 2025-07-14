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
    enterprise: {
      features: [
        'custom_avatar',
        'advanced_analytics',
        'custom_branding',
        'priority_support',
        'api_access',
        'sla',
        'custom_integrations',
      ],
      maxChatbots: -1, // unlimited
      maxKnowledgeBaseSize: -1, // unlimited
      maxMessagesPerDay: -1, // unlimited
    },
    free: {
      features: ['basic_avatar', 'basic_analytics'],
      maxChatbots: 1,
      maxKnowledgeBaseSize: 10,
      maxMessagesPerDay: 100,
    },
    professional: {
      features: [
        'custom_avatar',
        'advanced_analytics',
        'custom_branding',
        'priority_support',
        'api_access',
      ],
      maxChatbots: 20,
      maxKnowledgeBaseSize: 1000,
      maxMessagesPerDay: 10000,
    },
    starter: {
      features: ['custom_avatar', 'advanced_analytics', 'custom_branding'],
      maxChatbots: 5,
      maxKnowledgeBaseSize: 100,
      maxMessagesPerDay: 1000,
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
    const plan = SubscriptionPlan.PLANS[planName.toLowerCase()]

    if (!plan) {
      throw new Error(
        `Invalid subscription plan: ${planName}. Valid plans are: ${Object.keys(SubscriptionPlan.PLANS).join(', ')}`
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
