// @mostajs/audit — Menu contribution
// Author: Dr Hamid MADANI drmdh@msn.com

import { FileText } from 'lucide-react'
import type { ModuleMenuContribution } from '@mostajs/menu'

export const auditMenuContribution: ModuleMenuContribution = {
  moduleKey: 'audit',
  mergeIntoGroup: 'Administration',
  order: 80,
  items: [
    {
      label: 'audit.title',
      href: '/dashboard/audit',
      icon: FileText,
      permission: 'audit:view',
    },
  ],
}
