import type {
  Conversation,
  ConversationId,
  Message,
  MessageType,
  ConversationMetrics,
  SentimentAnalysis,
  IntentClassification
} from '@saas/types'
import { generateId } from '@saas/utils'

export class ConversationDomain {
  private static readonly INACTIVE_THRESHOLD_MINUTES = 5
  private static readonly ABANDONMENT_THRESHOLD_MINUTES = 30
  
  static generateConversationId(): ConversationId {
    return generateId('conv') as ConversationId
  }

  static generateMessageId(): string {
    return generateId('msg')
  }

  static calculateDuration(conversation: Conversation): number {
    if (!conversation.endedAt) {
      return Date.now() - conversation.startedAt.getTime()
    }
    return conversation.endedAt.getTime() - conversation.startedAt.getTime()
  }

  static isInactive(lastMessageTime: Date): boolean {
    const inactiveThreshold = this.INACTIVE_THRESHOLD_MINUTES * 60 * 1000
    return Date.now() - lastMessageTime.getTime() > inactiveThreshold
  }

  static isAbandoned(lastMessageTime: Date): boolean {
    const abandonmentThreshold = this.ABANDONMENT_THRESHOLD_MINUTES * 60 * 1000
    return Date.now() - lastMessageTime.getTime() > abandonmentThreshold
  }

  static calculateAverageResponseTime(messages: Message[]): number {
    const responseTimes: number[] = []
    
    for (let i = 1; i < messages.length; i++) {
      const currentMsg = messages[i]
      const previousMsg = messages[i - 1]
      
      if (currentMsg.sender !== previousMsg.sender) {
        const responseTime = currentMsg.createdAt.getTime() - previousMsg.createdAt.getTime()
        responseTimes.push(responseTime)
      }
    }
    
    if (responseTimes.length === 0) return 0
    
    const sum = responseTimes.reduce((acc, time) => acc + time, 0)
    return Math.round(sum / responseTimes.length)
  }

  static calculateSentimentTrend(messages: Message[]): 'improving' | 'stable' | 'declining' {
    const sentimentScores = messages
      .filter(msg => msg.sentimentScore !== undefined)
      .map(msg => msg.sentimentScore!)
    
    if (sentimentScores.length < 3) return 'stable'
    
    const recentScores = sentimentScores.slice(-3)
    const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    
    const olderScores = sentimentScores.slice(0, -3)
    const avgOlder = olderScores.reduce((a, b) => a + b, 0) / olderScores.length
    
    const difference = avgRecent - avgOlder
    
    if (difference > 0.1) return 'improving'
    if (difference < -0.1) return 'declining'
    return 'stable'
  }

  static aggregateSentiment(messages: Message[]): SentimentAnalysis {
    const sentiments = messages
      .filter(msg => msg.sentimentScore !== undefined)
      .map(msg => msg.sentimentScore!)
    
    if (sentiments.length === 0) {
      return {
        score: 0,
        confidence: 0,
        label: 'neutral'
      }
    }
    
    const avgScore = sentiments.reduce((a, b) => a + b, 0) / sentiments.length
    const label = avgScore > 0.3 ? 'positive' : avgScore < -0.3 ? 'negative' : 'neutral'
    
    return {
      score: avgScore,
      confidence: 0.8, // Simplified confidence calculation
      label
    }
  }

  static extractTopIntents(messages: Message[]): IntentClassification[] {
    const intentMap = new Map<string, { count: number; totalConfidence: number }>()
    
    messages.forEach(msg => {
      if (msg.intentClassification) {
        const intent = msg.intentClassification.intent
        const current = intentMap.get(intent) || { count: 0, totalConfidence: 0 }
        
        intentMap.set(intent, {
          count: current.count + 1,
          totalConfidence: current.totalConfidence + msg.intentClassification.confidence
        })
      }
    })
    
    return Array.from(intentMap.entries())
      .map(([intent, data]) => ({
        intent,
        confidence: data.totalConfidence / data.count,
        entities: []
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
  }

  static determineResolutionStatus(
    conversation: Conversation,
    messages: Message[]
  ): 'resolved' | 'unresolved' | 'escalated' {
    const lastMessages = messages.slice(-5)
    
    const hasPositiveEnd = lastMessages.some(
      msg => msg.sentimentScore && msg.sentimentScore > 0.5
    )
    
    const hasThankYou = lastMessages.some(
      msg => /thank you|thanks|solved|resolved|helpful/i.test(msg.content)
    )
    
    const hasEscalation = messages.some(
      msg => msg.type === 'system' && msg.content.includes('transferred to agent')
    )
    
    if (hasEscalation) return 'escalated'
    if (hasPositiveEnd || hasThankYou) return 'resolved'
    return 'unresolved'
  }

  static generateConversationSummary(messages: Message[]): string {
    if (messages.length === 0) return 'No messages in conversation'
    
    const visitorMessages = messages
      .filter(msg => msg.sender === 'visitor')
      .slice(0, 3)
      .map(msg => msg.content)
      .join(' ')
    
    const topics = this.extractTopIntents(messages)
      .map(intent => intent.intent)
      .slice(0, 3)
      .join(', ')
    
    const sentiment = this.aggregateSentiment(messages).label
    
    return `Topics: ${topics || 'General inquiry'}. Sentiment: ${sentiment}. Preview: ${visitorMessages.substring(0, 100)}...`
  }

  static sanitizeMessageContent(content: string, type: MessageType): string {
    if (type !== 'text') return content
    
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .trim()
  }

  static calculateMetrics(
    conversation: Conversation,
    messages: Message[]
  ): ConversationMetrics {
    const duration = this.calculateDuration(conversation)
    const visitorMessages = messages.filter(msg => msg.sender === 'visitor')
    const botMessages = messages.filter(msg => msg.sender === 'bot')
    
    return {
      conversationId: conversation.id,
      duration,
      messageCount: messages.length,
      visitorMessageCount: visitorMessages.length,
      botMessageCount: botMessages.length,
      averageResponseTime: this.calculateAverageResponseTime(messages),
      sentimentTrend: messages
        .filter(msg => msg.sentimentScore !== undefined)
        .map(msg => ({
          timestamp: msg.createdAt,
          score: msg.sentimentScore!
        })),
      resolutionStatus: this.determineResolutionStatus(conversation, messages)
    }
  }
}