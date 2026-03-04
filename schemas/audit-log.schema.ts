// @mosta/audit — AuditLog Entity Schema
// Author: Dr Hamid MADANI drmdh@msn.com
import type { EntitySchema } from '@mostajs/orm'

export const AuditLogSchema: EntitySchema = {
  name: 'AuditLog',
  collection: 'auditlogs',
  timestamps: false,

  fields: {
    userName:   { type: 'string', required: true },
    userRole:   { type: 'string', required: true },
    action:     { type: 'string', required: true },
    module:     { type: 'string', required: true },
    resource:   { type: 'string', default: '' },
    resourceId: { type: 'string', default: '' },
    details:    { type: 'json' },
    ipAddress:  { type: 'string', default: '' },
    status:     { type: 'string', enum: ['success', 'failure'], default: 'success' },
    timestamp:  { type: 'date', default: 'now' },
  },

  relations: {
    userId: { target: 'User', type: 'many-to-one', required: true },
  },

  indexes: [
    { fields: { timestamp: 'desc' } },
    { fields: { module: 'asc', timestamp: 'desc' } },
    { fields: { userId: 'asc', timestamp: 'desc' } },
  ],
}
