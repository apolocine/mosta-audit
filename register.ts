// @mostajs/audit — Runtime module registration
// Author: Dr Hamid MADANI drmdh@msn.com

import type { ModuleRegistration } from '@mostajs/socle'
import { AuditLogSchema } from './schemas/audit-log.schema.js'
import { AuditLogRepository } from './repositories/audit-log.repository.js'
import { auditMenuContribution } from './lib/menu.js'
import { GET as auditLogGET } from './lib/handlers/audit-log.js'
import AuditPage from './pages/AuditPage.js'

export function register(registry: { register(r: ModuleRegistration): void }): void {
  registry.register({
    manifest: {
      name: 'audit',
      package: '@mostajs/audit',
      version: '2.0.0',
      type: 'core',
      priority: 5,
      dependencies: ['auth'],
      displayName: 'Audit',
      description: 'Audit logging — activity journal with filtering and pagination',
      icon: 'FileText',
      register: './dist/register.js',
    },

    schemas: [
      { name: 'AuditLog', schema: AuditLogSchema },
    ],

    repositories: {
      auditLogRepo: (dialect: unknown) => new AuditLogRepository(dialect as never),
    },

    permissions: {
      permissions: { AUDIT_VIEW: 'audit:view' },
      definitions: [
        { code: 'audit:view', name: 'audit:view', description: 'Consulter les journaux d\'audit', category: 'audit' },
      ],
      categories: [
        { name: 'audit', label: 'Audit', description: 'Consultation des journaux d\'audit', icon: 'FileText', order: 20, system: true },
      ],
    },

    routes: [
      { path: 'audit-log', handlers: { GET: auditLogGET }, permission: 'audit:view' },
    ],

    pages: [
      { path: 'audit', component: AuditPage, permission: 'audit:view' },
    ],

    menu: auditMenuContribution,
  })
}
