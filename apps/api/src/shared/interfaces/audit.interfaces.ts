export interface IAuditEntry {
  id?: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  details?: {
    changes?: Record<string, { old: unknown; new: unknown }>
    reason?: string
    metadata?: Record<string, string | number | boolean>
  }
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}

export interface IAuditService {
  log(entry: Omit<IAuditEntry, 'id' | 'timestamp'>): Promise<void>
  getAuditLog(filters: {
    userId?: string
    resource?: string
    action?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }): Promise<{ entries: IAuditEntry[]; total: number }>
}
