// Base filter types
export interface BaseFilters {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

// Tenant DTOs
export interface CreateTenantDto {
  name: string
  slug?: string
  plan?: 'free' | 'starter' | 'professional' | 'enterprise'
  maxUsers?: number
  maxChatbots?: number
}

export interface UpdateTenantDto {
  name?: string
  plan?: 'free' | 'starter' | 'professional' | 'enterprise'
  maxUsers?: number
  maxChatbots?: number
  isActive?: boolean
}

export interface TenantFilters extends BaseFilters {
  isActive?: boolean
  plan?: 'free' | 'starter' | 'professional' | 'enterprise'
  search?: string
}

// Chatbot DTOs are already defined in chatbot.interfaces.ts

// Conversation DTOs are already defined in conversation.interfaces.ts

// Message DTOs
export interface CreateMessageDto {
  conversationId: string
  role: 'USER' | 'ASSISTANT' | 'SYSTEM'
  content: string
  model?: string
  promptTokens?: number
  completionTokens?: number
  totalCost?: number
  latencyMs?: number
  sentiment?: string
  triggeredAnimation?: string
}

export interface ConversationFilters extends BaseFilters {
  status?: 'ACTIVE' | 'ENDED' | 'ARCHIVED'
  chatbotId?: string
  startDate?: Date
  endDate?: Date
}

// Job types
export interface AIProcessingJobData {
  conversationId: string
  chatbotId: string
  message: string
  sessionId: string
  timestamp: string
}

export interface TenantProvisioningJobData {
  tenantId: string
  action: 'create' | 'update' | 'delete'
}

// Metadata types
export interface ThemeMetadata {
  primaryColor?: string
  secondaryColor?: string
  fontFamily?: string
  borderRadius?: string
  [key: string]: string | undefined
}

export interface ChatbotMetadata {
  version?: string
  tags?: string[]
  customFields?: Record<string, string | number | boolean>
}

export interface DocumentMetadata {
  source?: string
  author?: string
  createdDate?: string
  tags?: string[]
  category?: string
}

// Logging metadata
export interface LogMetadata {
  [key: string]: string | number | boolean | undefined
}

// Audit details
export interface AuditDetails {
  changes?: Record<string, { old: unknown; new: unknown }>
  reason?: string
  metadata?: Record<string, string | number | boolean>
}
