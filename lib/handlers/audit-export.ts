// @mostajs/audit — Export handler
// Author: Dr Hamid MADANI drmdh@msn.com

import { auditToCsv, auditToJson } from '../export.js'

export function createAuditExportHandler(getRepo: () => any, checkPermission?: (perm: string) => Promise<any>) {
  return async function GET(req: Request): Promise<Response> {
    // Check permission if provided
    if (checkPermission) {
      const check = await checkPermission('audit:export')
      if (check?.error) return check.error
    }

    const url = new URL(req.url)
    const format = url.searchParams.get('format') ?? 'json'
    const from = url.searchParams.get('from') ?? undefined
    const to = url.searchParams.get('to') ?? undefined
    const module = url.searchParams.get('module') ?? undefined
    const limit = parseInt(url.searchParams.get('limit') ?? '10000', 10)

    const repo = getRepo()
    const filter: any = {}
    if (module) filter.module = module
    if (from || to) {
      filter.timestamp = {}
      if (from) filter.timestamp.$gte = new Date(from)
      if (to) filter.timestamp.$lte = new Date(to)
    }

    const { data } = await repo.findPaginated({ ...filter, page: 1, limit })

    if (format === 'csv') {
      const csv = auditToCsv(data)
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit-export-${new Date().toISOString().slice(0,10)}.csv"`,
        },
      })
    }

    const json = auditToJson(data)
    return new Response(json, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit-export-${new Date().toISOString().slice(0,10)}.json"`,
      },
    })
  }
}
