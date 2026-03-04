// @mosta/audit — Core audit functions
// Author: Dr Hamid MADANI drmdh@msn.com
import { getDialect } from '@mostajs/orm'
import { AuditLogRepository } from '../repositories/audit-log.repository'
import type { AuditParams } from '../types'

/**
 * Log an audit entry. Fire-and-forget — never throws, never blocks.
 */
export async function logAudit(params: AuditParams): Promise<void> {
  try {
    const repo = new AuditLogRepository(await getDialect())
    await repo.create({
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      action: params.action,
      module: params.module,
      resource: params.resource || '',
      resourceId: params.resourceId || '',
      details: params.details || {},
      ipAddress: params.ipAddress || '',
      status: params.status || 'success',
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[MostaAudit] Error:', err)
  }
}

/**
 * Extract audit user info from a NextAuth-style session.
 */
export function getAuditUser(session: any): { userId: string; userName: string; userRole: string } {
  const { role, roles } = session.user as any
  return {
    userId: session.user.id,
    userName: session.user.name || session.user.email,
    userRole: role || (Array.isArray(roles) ? roles.join(', ') : 'unknown'),
  }
}
