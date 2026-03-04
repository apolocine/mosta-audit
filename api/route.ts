// @mosta/audit — API Route template
// Author: Dr Hamid MADANI drmdh@msn.com
//
// Copy to: src/app/api/admin/audit/route.ts
// Usage:
//   import { createAuditHandlers } from '@mosta/audit/api/route'
//   import { checkPermission } from '@mosta/auth'
//   export const { GET } = createAuditHandlers('audit:view', checkPermission)

import { NextRequest, NextResponse } from 'next/server'
import { getDialect } from '@mostajs/orm'
import { AuditLogRepository } from '../repositories/audit-log.repository'

type PermissionChecker = (permission: string) => Promise<{
  error: NextResponse | null
  session: any
}>

/**
 * Creates a GET handler for paginated audit log consultation.
 */
export function createAuditHandlers(
  permission: string,
  checkPermission: PermissionChecker,
) {
  async function GET(req: NextRequest) {
    const { error } = await checkPermission(permission)
    if (error) return error

    const url = req.nextUrl
    const filters = {
      module: url.searchParams.get('module') || undefined,
      action: url.searchParams.get('action') || undefined,
      userId: url.searchParams.get('userId') || undefined,
      status: (url.searchParams.get('status') as 'success' | 'failure') || undefined,
      from: url.searchParams.get('from') ? new Date(url.searchParams.get('from')!) : undefined,
      to: url.searchParams.get('to') ? new Date(url.searchParams.get('to')!) : undefined,
      page: parseInt(url.searchParams.get('page') || '1', 10),
      limit: parseInt(url.searchParams.get('limit') || '50', 10),
    }

    const repo = new AuditLogRepository(await getDialect())
    const { data, total } = await repo.findPaginated(filters)

    return NextResponse.json({
      data,
      meta: {
        total,
        page: filters.page,
        limit: filters.limit,
        pages: Math.ceil(total / filters.limit),
      },
    })
  }

  return { GET }
}
