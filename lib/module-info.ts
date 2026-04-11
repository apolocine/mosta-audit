// @mostajs/audit — Module info (schemas, seeds, metadata)
// Author: Dr Hamid MADANI drmdh@msn.com

import { AuditLogSchema } from '../schemas/audit-log.schema.js'

export function getSchemas() {
  return [AuditLogSchema]
}

export const moduleInfo = {
  name: 'audit',
  label: 'Audit & Logs',
  description: 'Audit logging with paginated consultation',
  schemas: getSchemas,
  seed: async () => {
    // Audit has no seed data
    return {}
  },
}
