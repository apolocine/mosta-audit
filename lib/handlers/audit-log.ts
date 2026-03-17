// @mostajs/audit — Route handler for audit-log
// Author: Dr Hamid MADANI drmdh@msn.com
// Bare handler — NO auth. The socle catch-all does it via permission.

import { AuditLogRepository } from '../../repositories/audit-log.repository.js'

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = parseInt(url.searchParams.get('limit') || '50', 10)
  const module = url.searchParams.get('module') || undefined
  const action = url.searchParams.get('action') || undefined
  const userId = url.searchParams.get('userId') || undefined
  const status = (url.searchParams.get('status') as 'success' | 'failure') || undefined
  const dateFrom = url.searchParams.get('dateFrom') || url.searchParams.get('from') || null
  const dateTo = url.searchParams.get('dateTo') || url.searchParams.get('to') || null

  const { getDialect } = await import('@mostajs/orm')
  const dialect = await getDialect()
  const repo = new AuditLogRepository(dialect)

  const { data: logs, total } = await repo.findPaginated({
    module, action, userId, status,
    from: dateFrom ? new Date(dateFrom) : undefined,
    to: dateTo ? new Date(dateTo + 'T23:59:59.999Z') : undefined,
    page, limit,
  })

  return Response.json({
    data: logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}
