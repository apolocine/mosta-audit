// @mosta/audit — Barrel exports
// Author: Dr Hamid MADANI drmdh@msn.com

// Core
export { logAudit, getAuditUser } from './lib/audit'

// Repository & Schema
export { AuditLogRepository } from './repositories/audit-log.repository'
export { AuditLogSchema } from './schemas/audit-log.schema'

// API helpers
export { createAuditHandlers } from './api/route'

// Menu contribution
export { auditMenuContribution } from './lib/menu'

// Pages
export { default as AuditPage } from './pages/AuditPage'

// I18n
export { t as auditT } from './lib/i18n'

// Types
export type {
  MostaAuditConfig,
  AuditParams,
  AuditFilters,
  AuditLogDTO,
} from './types/index'
