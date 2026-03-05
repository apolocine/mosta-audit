// @mosta/audit — Types
// Author: Dr Hamid MADANI drmdh@msn.com

export interface MostaAuditConfig {
  /** Known modules for UI filters */
  modules?: string[]
  /** Known actions for UI filters */
  actions?: string[]
}

export interface AuditParams {
  userId: string
  userName: string
  userRole: string
  action: string
  module: string
  resource?: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  status?: 'success' | 'failure'
}

export interface AuditFilters {
  module?: string
  action?: string
  userId?: string
  status?: 'success' | 'failure'
  from?: Date
  to?: Date
  page?: number
  limit?: number
}

export interface AuditLogDTO {
  id: string
  userId: any
  userName: string
  userRole: string
  action: string
  module: string
  resource: string
  resourceId: string
  details: Record<string, unknown> | null
  ipAddress: string
  status: 'success' | 'failure'
  timestamp: string
}
