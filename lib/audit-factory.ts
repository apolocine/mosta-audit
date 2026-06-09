// audit-factory.ts — Centralized repository factory
// DI-first : l'application hôte injecte SON dialecte (depuis SON .env). Repli optionnel sur
// @mostajs/data-plug (remplace @mostajs/octoswitcher). Aucune dépendance dure de résolveur.
// Author: Dr Hamid MADANI <drmdh@msn.com>

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
// Factory — DI-first, repli .env via data-plug
// ============================================================

let _cached: IAuditLogRepository | null = null
let _injectedDialect: unknown = null

/**
 * Injection de dépendance (RECOMMANDÉ) : l'application hôte fournit SON dialecte ORM, construit
 * depuis SON `.env`. C'est la voie la moins dépendante et la moins risquée — aucun résolveur,
 * aucune seconde instance d'ORM (donc pas de double-package). Sans injection, repli sur
 * `@mostajs/data-plug` (résolution depuis le `.env` de l'hôte).
 */
export function configureAudit(opts: { dialect: unknown }): void {
  if (opts && opts.dialect) {
    _injectedDialect = opts.dialect
    _cached = null
  }
}

/** Get audit repository — dialecte injecté (DI) sinon résolu depuis le `.env` via data-plug. */
export async function getAuditRepo(): Promise<IAuditLogRepository> {
  if (_cached) return _cached

  const { AuditLogRepository } = await import('../repositories/audit-log.repository.js')

  // 1) Dialecte injecté par l'hôte (DI) — chemin principal, zéro dépendance résolveur.
  if (_injectedDialect) {
    _cached = new AuditLogRepository(_injectedDialect as never) as IAuditLogRepository
    return _cached
  }

  // 2) Repli : résolution depuis le `.env` de l'hôte via @mostajs/data-plug (remplace octoswitcher).
  //    Import par spécifieur variable → dépendance OPTIONNELLE (inutile si l'hôte injecte).
  const spec = '@mostajs/data-plug'
  const mod = (await import(spec)) as { getDialect: () => Promise<unknown> }
  const dialect = await mod.getDialect()
  _cached = new AuditLogRepository(dialect as never) as IAuditLogRepository
  return _cached
}

/** Reset cache (for tests) */
export function resetAuditRepo(): void {
  _cached = null
  _injectedDialect = null
}
