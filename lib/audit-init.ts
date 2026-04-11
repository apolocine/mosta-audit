// audit-init.ts — Ensure AuditLog schema is ready
// Uses octoswitcher — schema registration works transparently in ORM and NET mode
// Author: Dr Hamid MADANI drmdh@msn.com

import { AuditLogSchema } from '../schemas/audit-log.schema.js'

let initialized = false

export async function ensureAuditSchema(): Promise<void> {
  if (initialized) return
  const { registerSchemas } = await import('@mostajs/orm')
  registerSchemas([AuditLogSchema])
  initialized = true
}
