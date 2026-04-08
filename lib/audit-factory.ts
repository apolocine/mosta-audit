// audit-factory.ts — Centralized repository factory
// Uses @mostajs/octoswitcher to get the right dialect (ORM or NET)
// Author: Dr Hamid MADANI drmdh@msn.com

import { AuditLogSchema } from '../schemas/audit-log.schema.js'
import type { AuditLogDTO, AuditFilters } from '../types/index.js'

// ============================================================
// Repository interface
// ============================================================

export interface IAuditLogRepository {
  create(data: Record<string, unknown>): Promise<AuditLogDTO>
  findPaginated(filters: AuditFilters): Promise<{ data: AuditLogDTO[]; total: number }>
  findByResource(resourceId: string, modules?: string[]): Promise<AuditLogDTO[]>
  deleteOlderThan(days: number): Promise<number>
}

// ============================================================
// Factory — dialect resolved by octoswitcher
// ============================================================

let _cached: IAuditLogRepository | null = null

/** Get audit repository — dialect resolved by octoswitcher (ORM or NET) */
export async function getAuditRepo(): Promise<IAuditLogRepository> {
  if (_cached) return _cached

  const { getDialect } = await import('@mostajs/octoswitcher')
  const { registerSchemas } = await import('@mostajs/orm')
  const { AuditLogRepository } = await import('../repositories/audit-log.repository.js')

  registerSchemas([AuditLogSchema])
  const dialect = await getDialect()
  if (typeof (dialect as any).initSchema === 'function') {
    const { getAllSchemas } = await import('@mostajs/orm')
    await (dialect as any).initSchema(getAllSchemas())
  }
  _cached = new AuditLogRepository(dialect as any) as IAuditLogRepository
  return _cached
}

/** Reset cache (for tests) */
export function resetAuditRepo(): void { _cached = null }
