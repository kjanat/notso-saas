import { injectable } from 'tsyringe'
import type { IAuditEntry, IAuditService } from '../interfaces/audit.interfaces.js'
import { logger } from '../utils/logger.js'

@injectable()
export class AuditService implements IAuditService {
  async log(entry: Omit<IAuditEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      // In a real implementation, this would save to a database
      // For now, we'll just log it
      logger.info('Audit log entry', {
        ...entry,
        timestamp: new Date().toISOString(),
      })

      // TODO: Implement database storage
      // const db = getDatabase()
      // await db.auditLog.create({
      //   data: {
      //     ...entry,
      //     timestamp: new Date(),
      //   },
      // })
    } catch (error) {
      logger.error('Failed to log audit entry', error)
      // Don't throw - audit logging should not break the main flow
    }
  }

  async getAuditLog(_filters: {
    userId?: string
    resource?: string
    action?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }): Promise<{ entries: IAuditEntry[]; total: number }> {
    // TODO: Implement database query
    // const db = getDatabase()
    // const where: any = {}

    // if (filters.userId) where.userId = filters.userId
    // if (filters.resource) where.resource = filters.resource
    // if (filters.action) where.action = filters.action
    // if (filters.startDate || filters.endDate) {
    //   where.timestamp = {}
    //   if (filters.startDate) where.timestamp.gte = filters.startDate
    //   if (filters.endDate) where.timestamp.lte = filters.endDate
    // }

    // const [entries, total] = await Promise.all([
    //   db.auditLog.findMany({
    //     where,
    //     take: filters.limit || 50,
    //     skip: filters.offset || 0,
    //     orderBy: { timestamp: 'desc' },
    //   }),
    //   db.auditLog.count({ where }),
    // ])

    // return { entries, total }

    // Temporary mock implementation
    return {
      entries: [],
      total: 0,
    }
  }
}
