// @mostajs/audit — Export audit logs to CSV/JSON
// Author: Dr Hamid MADANI drmdh@msn.com

export interface ExportOptions {
  format: 'csv' | 'json'
  from?: string      // ISO date
  to?: string        // ISO date
  module?: string
  action?: string
  limit?: number     // max rows (default 10000)
}

export function auditToCsv(logs: any[]): string {
  if (logs.length === 0) return ''
  const headers = ['timestamp', 'userName', 'userRole', 'module', 'action', 'resource', 'resourceId', 'status', 'ipAddress', 'details']
  const rows = logs.map(log => {
    return headers.map(h => {
      let val = log[h] ?? ''
      if (h === 'details' && typeof val === 'object') val = JSON.stringify(val)
      if (h === 'timestamp' && val instanceof Date) val = val.toISOString()
      // Escape CSV
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"'
      }
      return str
    }).join(',')
  })
  return [headers.join(','), ...rows].join('\n')
}

export function auditToJson(logs: any[]): string {
  return JSON.stringify(logs, null, 2)
}
