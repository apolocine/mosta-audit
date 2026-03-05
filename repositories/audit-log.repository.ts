// @mosta/audit — AuditLogRepository
// Author: Dr Hamid MADANI drmdh@msn.com
import { BaseRepository } from '@mostajs/orm'
import { AuditLogSchema } from '../schemas/audit-log.schema'
import type { IDialect, FilterQuery, QueryOptions } from '@mostajs/orm'
import type { AuditLogDTO, AuditFilters } from '../types/index'

export class AuditLogRepository extends BaseRepository<AuditLogDTO> {
  constructor(dialect: IDialect) {
    super(AuditLogSchema, dialect)
  }

  /** Find paginated audit logs with optional filters */
  async findPaginated(
    filters: AuditFilters = {},
    options?: QueryOptions,
  ): Promise<{ data: AuditLogDTO[]; total: number }> {
    const query: FilterQuery = {}

    if (filters.module) query.module = filters.module
    if (filters.action) query.action = { $regex: filters.action, $regexFlags: 'i' }
    if (filters.userId) query.userId = filters.userId
    if (filters.status) query.status = filters.status
    if (filters.from || filters.to) {
      query.timestamp = {}
      if (filters.from) (query.timestamp as any).$gte = filters.from
      if (filters.to) (query.timestamp as any).$lte = filters.to
    }

    const page = filters.page || 1
    const limit = filters.limit || 50
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.findAll(query, { sort: { timestamp: -1 }, skip, limit, ...options }),
      this.count(query),
    ])

    return { data, total }
  }

  /** Find audit logs related to a specific resource */
  async findByResource(resourceId: string, modules?: string[], options?: QueryOptions): Promise<AuditLogDTO[]> {
    const query: FilterQuery = { resourceId }
    if (modules && modules.length > 0) {
      query.module = { $in: modules }
    }
    return this.findAll(query, { sort: { timestamp: -1 }, ...options })
  }

  /** Delete logs older than N days */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoff = new Date(Date.now() - days * 86400000)
    return this.deleteMany({ timestamp: { $lt: cutoff } } as any)
  }
}
