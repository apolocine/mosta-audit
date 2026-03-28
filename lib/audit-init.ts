// audit-init.ts — Ensure AuditLog schema is ready (ORM or NET)
// Author: Dr Hamid MADANI drmdh@msn.com

import { isNetMode } from './data-mode.js'
import { AuditLogSchema } from '../schemas/audit-log.schema.js'

let initialized = false

export async function ensureAuditSchema(): Promise<void> {
  if (initialized) return

  if (isNetMode()) {
    const { NetClient } = await import('@mostajs/net/client')
    const client = new NetClient({ url: process.env.MOSTA_NET_URL! })
    const result = await client.compareSchema(AuditLogSchema as any)
    if (!result.exists || !result.compatible) {
      await client.applySchema([AuditLogSchema as any])
    }
  } else {
    const { registerSchemas } = await import('@mostajs/orm')
    registerSchemas([AuditLogSchema])
  }

  initialized = true
}
