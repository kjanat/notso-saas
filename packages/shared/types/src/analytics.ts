/**
 * Analytics and reporting types
 */

import type {
  TenantId,
  ChatbotId,
  ConversationId,
  UserId /* , Timestamps - available if needed */,
} from './base'

export interface AnalyticsEvent {
  id: string
  tenantId: TenantId
  eventType: EventType
  eventCategory: EventCategory
  eventData: Record<string, any>
  source: EventSource
  sessionId?: string
  userId?: UserId
  timestamp: Date
  metadata?: Record<string, any>
}

export type EventType =
  | 'page_view'
  | 'chat_started'
  | 'chat_ended'
  | 'message_sent'
  | 'button_clicked'
  | 'form_submitted'
  | 'error_occurred'
  | 'api_called'
  | 'custom'

export type EventCategory = 'engagement' | 'performance' | 'error' | 'conversion' | 'technical'

export type EventSource = 'widget' | 'api' | 'admin' | 'system'

export interface ConversationAnalytics {
  tenantId: TenantId
  chatbotId: ChatbotId
  conversationId: ConversationId
  metrics: {
    duration: number
    messageCount: number
    responseTime: {
      average: number
      min: number
      max: number
    }
    sentimentScore: {
      overall: number
      trend: 'improving' | 'stable' | 'declining'
      breakdown: {
        positive: number
        neutral: number
        negative: number
      }
    }
    resolution: {
      status: 'resolved' | 'unresolved' | 'escalated'
      satisfactionScore?: number
    }
  }
  intents: Array<{
    intent: string
    count: number
    confidence: number
  }>
  topics: string[]
}

export interface DashboardMetrics {
  tenantId: TenantId
  period: AnalyticsPeriod
  metrics: {
    conversations: {
      total: number
      active: number
      completed: number
      abandoned: number
      averageDuration: number
    }
    messages: {
      total: number
      byVisitor: number
      byBot: number
      averagePerConversation: number
    }
    satisfaction: {
      score: number
      responseCount: number
      nps: number
    }
    performance: {
      responseTime: number
      resolutionRate: number
      escalationRate: number
      uptime: number
    }
    usage: {
      activeUsers: number
      apiCalls: number
      storageUsed: number
      costEstimate: number
    }
  }
  trends: {
    conversations: TrendData
    satisfaction: TrendData
    responseTime: TrendData
  }
}

export interface TrendData {
  current: number
  previous: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
}

export interface Report {
  id: string
  tenantId: TenantId
  name: string
  type: ReportType
  schedule?: ReportSchedule
  recipients: string[]
  filters: ReportFilters
  format: 'pdf' | 'csv' | 'json'
  createdBy: UserId
  lastGeneratedAt?: Date
  nextScheduledAt?: Date
}

export type ReportType =
  | 'conversation_summary'
  | 'performance_metrics'
  | 'user_satisfaction'
  | 'cost_analysis'
  | 'usage_report'
  | 'custom'

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  dayOfWeek?: number // 0-6
  dayOfMonth?: number // 1-31
  timeOfDay: string // HH:mm
  timezone: string
}

export interface ReportFilters {
  dateRange: DateRange
  chatbotIds?: ChatbotId[]
  conversationStatus?: string[]
  sentimentRange?: [number, number]
  customFilters?: Record<string, any>
}

export interface DateRange {
  start: Date
  end: Date
}

export type AnalyticsPeriod = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

export interface HeatmapData {
  dayOfWeek: number
  hourOfDay: number
  value: number
  metric: 'conversations' | 'messages' | 'response_time'
}

export interface FunnelStep {
  name: string
  count: number
  conversionRate: number
  averageTime?: number
}

export interface ConversionFunnel {
  name: string
  steps: FunnelStep[]
  overallConversion: number
  period: DateRange
}

// Real-time dashboard
export interface RealtimeMetrics {
  activeConversations: number
  queuedMessages: number
  averageWaitTime: number
  onlineAgents: number
  systemHealth: {
    cpu: number
    memory: number
    apiLatency: number
    errorRate: number
  }
}

export interface AlertRule {
  id: string
  tenantId: TenantId
  name: string
  condition: AlertCondition
  threshold: number
  actions: AlertAction[]
  isActive: boolean
  lastTriggered?: Date
}

export interface AlertCondition {
  metric: string
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  timeWindow: number // minutes
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count'
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'sms' | 'slack'
  config: Record<string, any>
}
