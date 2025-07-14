import type {
  AvatarConfiguration,
  Chatbot,
  // ChatbotId, // Kept for future use
  PersonalityConfiguration,
  WidgetConfiguration,
} from '@saas/types'
import { generateDeploymentKey, ValidationError } from '@saas/utils'

export class ChatbotDomain {
  private static readonly DEFAULT_PERSONALITIES: Record<string, Partial<PersonalityConfiguration>> =
    {
      friendly: {
        systemPrompt:
          'You are a friendly and helpful assistant. Be warm, engaging, and create a positive experience for users.',
        temperature: 0.8,
        tone: 'friendly',
      },
      professional: {
        systemPrompt:
          'You are a professional customer service representative. Be helpful, concise, and maintain a professional tone.',
        temperature: 0.7,
        tone: 'professional',
      },
      technical: {
        systemPrompt:
          'You are a technical support specialist. Provide accurate, detailed technical information while remaining clear and helpful.',
        temperature: 0.6,
        tone: 'formal',
      },
    }

  static validateChatbotConfig(chatbot: Partial<Chatbot>): void {
    if (!chatbot.name || chatbot.name.length < 2) {
      throw new ValidationError('Chatbot name must be at least 2 characters')
    }

    if (!chatbot.slug || chatbot.slug.length < 3) {
      throw new ValidationError('Chatbot slug must be at least 3 characters')
    }

    if (chatbot.personalityConfig) {
      ChatbotDomain.validatePersonalityConfig(chatbot.personalityConfig)
    }

    if (chatbot.widgetConfig) {
      ChatbotDomain.validateWidgetConfig(chatbot.widgetConfig)
    }
  }

  static validatePersonalityConfig(config: PersonalityConfiguration): void {
    if (config.temperature < 0 || config.temperature > 1) {
      throw new ValidationError('Temperature must be between 0 and 1')
    }

    if (config.maxTokens < 1 || config.maxTokens > 4096) {
      throw new ValidationError('Max tokens must be between 1 and 4096')
    }

    if (!config.systemPrompt || config.systemPrompt.length < 10) {
      throw new ValidationError('System prompt must be at least 10 characters')
    }
  }

  static validateWidgetConfig(config: WidgetConfiguration): void {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

    if (!hexColorRegex.test(config.theme.primaryColor)) {
      throw new ValidationError('Invalid primary color format')
    }

    if (!hexColorRegex.test(config.theme.backgroundColor)) {
      throw new ValidationError('Invalid background color format')
    }

    if (
      config.allowFileUploads &&
      (!config.allowedFileTypes || config.allowedFileTypes.length === 0)
    ) {
      throw new ValidationError(
        'Allowed file types must be specified when file uploads are enabled'
      )
    }
  }

  static generateDeploymentKey(): string {
    return generateDeploymentKey()
  }

  static getDefaultPersonality(
    type: keyof typeof ChatbotDomain.DEFAULT_PERSONALITIES
  ): PersonalityConfiguration {
    const defaults = ChatbotDomain.DEFAULT_PERSONALITIES[type]
    return {
      fallbackResponses: [
        "I'm sorry, I didn't quite understand that. Could you please rephrase?",
        "I'm not sure about that. Let me connect you with a human agent who can help better.",
        "That's an interesting question. Could you provide more details?",
      ],
      language: 'en',
      maxTokens: 1024,
      name: type,
      personality: type,
      role: 'Customer Service Representative',
      systemPrompt: defaults.systemPrompt || '',
      temperature: defaults.temperature || 0.7,
      tone: defaults.tone || 'professional',
      welcomeMessage: 'Hello! How can I help you today?',
    }
  }

  static getDefaultWidgetConfig(): WidgetConfiguration {
    return {
      allowedFileTypes: [],
      allowFileUploads: false,
      autoOpen: false,
      autoOpenDelay: 5000,
      position: 'bottom-right',
      showAvatar: true,
      showTypingIndicator: true,
      size: 'medium',
      theme: {
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        primaryColor: '#0066cc',
        textColor: '#333333',
      },
    }
  }

  static getDefaultAvatarConfig(): AvatarConfiguration {
    return {
      animations: [
        {
          duration: 3000,
          name: 'idle',
          trigger: 'idle',
        },
        {
          duration: 2000,
          name: 'greeting',
          trigger: 'greeting',
        },
        {
          duration: 1500,
          name: 'thinking',
          trigger: 'thinking',
        },
        {
          duration: 2000,
          name: 'speaking',
          trigger: 'speaking',
        },
      ],
      customization: {},
    }
  }

  static calculateResponseDelay(messageLength: number): number {
    const baseDelay = 500
    const perCharDelay = 10
    const maxDelay = 3000

    const delay = baseDelay + messageLength * perCharDelay
    return Math.min(delay, maxDelay)
  }

  static shouldEscalateToHuman(sentimentScore?: number, messageCount?: number): boolean {
    if (sentimentScore && sentimentScore < -0.5) {
      return true
    }

    if (messageCount && messageCount > 10) {
      return true
    }

    return false
  }

  static sanitizeKnowledgeBaseContent(content: string): string {
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/on\w+\s*=\s*'[^']*'/gi, '')
      .trim()
  }
}
