// audit-factory.ts — Centralized repository factory for dual ORM/NET mode
// Same pattern as @mosta/rbac repos-factory.ts
// Author: Dr Hamid MADANI drmdh@msn.com

import { isNetMode } from './data-mode.js'
import { AuditLogSchema } from '../schemas/audit-log.schema.js'
import type { AuditLogDTO, AuditFilters } from '../types/index.js'

// ============================================================
// Repository interface (same API for ORM and NET)
// ============================================================

export interface IAuditLogRepository {
  create(data: Record<string, unknown>): Promise<AuditLogDTO>
  findPaginated(filters: AuditFilters): Promise<{ data: AuditLogDTO[]; total: number }>
  findByResource(resourceId: string, modules?: string[]): Promise<AuditLogDTO[]>
  deleteOlderThan(days: number): Promise<number>
}

// ============================================================
// Factory
// ============================================================

let _cached: IAuditLogRepository | null = null
let _schemaReady = false

/** Get audit repository for the current data mode (ORM or NET) */
export async function getAuditRepo(): Promise<IAuditLogRepository> {
  if (_cached) return _cached

  if (isNetMode()) {
    await ensureSchemaNet()
    _cached = createNetRepo()
  } else {
    await ensureSchemaOrm()
    _cached = await createOrmRepo()
  }
  return _cached
}

/** Reset cache (for tests) */
export function resetAuditRepo(): void { _cached = null; _schemaReady = false }

// ============================================================
// Schema init
// ============================================================

async function ensureSchemaOrm(): Promise<void> {
  if (_schemaReady) return
  const { registerSchemas } = await import('@mostajs/orm')
  registerSchemas([AuditLogSchema])
  _schemaReady = true
}

async function ensureSchemaNet(): Promise<void> {
  if (_schemaReady) return
  const { NetClient } = await import('@mostajs/net/client')
  const client = new NetClient({ url: process.env.MOSTA_NET_URL! })
  const result = await client.compareSchema(AuditLogSchema as any)
  if (!result.exists || !result.compatible) {
    await client.applySchema([AuditLogSchema as any])
  }
  _schemaReady = true
}

// ============================================================
// ORM mode
// ============================================================

async function createOrmRepo(): Promise<IAuditLogRepository> {
  const { getDialect } = await import('@mostajs/orm')
  const { AuditLogRepository } = await import('../repositories/audit-log.repository.js')
  const dialect = await getDialect()
  return new AuditLogRepository(dialect) as IAuditLogRepository
}

// ============================================================
// NET mode
// ============================================================

function createNetRepo(): IAuditLogRepository {
  const clientPromise = import('@mostajs/net/client').then(
    m => new m.NetClient({ url: process.env.MOSTA_NET_URL! })
  )

  return {
    async create(data) {
      const c = await clientPromise
      return c.create('auditlogs', data)
    },

    async findPaginated(filters) {
      const c = await clientPromise
      const netFilter: Record<string, unknown> = {}
      if (filters.module) netFilter.module = filters.module
      if (filters.action) netFilter.action = { $regex: filters.action, $regexFlags: 'i' }
      if (filters.userId) netFilter.userId = filters.userId
      if (filters.status) netFilter.status = filters.status
      if (filters.from || filters.to) {
        const ts: any = {}
        if (filters.from) ts.$gte = new Date(filters.from as any).toISOString()
        if (filters.to) ts.$lte = new Date(filters.to as any).toISOString()
        netFilter.timestamp = ts
      }

      const page = (filters as any).page || 1
      const limit = (filters as any).limit || 50
      const options = { sort: { timestamp: -1 }, skip: (page - 1) * limit, limit }

      const [data, total] = await Promise.all([
        c.findAll('auditlogs', netFilter, options),
        c.count('auditlogs', netFilter),
      ])
      return { data, total }
    },

    async findByResource(resourceId, modules?) {
      const c = await clientPromise
      const filter: Record<string, unknown> = { resourceId }
      if (modules?.length) filter.module = { $in: modules }
      return c.findAll('auditlogs', filter, { sort: { timestamp: -1 } })
    },

    async deleteOlderThan(days) {
      const c = await clientPromise
      const cutoff = new Date(Date.now() - days * 86400000).toISOString()
      return c.deleteMany('auditlogs', { timestamp: { $lt: cutoff } })
    },
  }
}
