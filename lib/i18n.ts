// @mostajs/audit — Minimal i18n helper
// Author: Dr Hamid MADANI drmdh@msn.com

import audit from '../i18n/fr/audit.json' with { type: 'json' }

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return path
    }
  }
  return typeof current === 'string' ? current : path
}

export function t(key: string, params?: Record<string, string | number>): string {
  const [namespace, ...rest] = key.split('.')
  if (namespace !== 'audit') return key

  let value = getNestedValue(audit as Record<string, unknown>, rest.join('.'))

  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      value = value.replace(`{{${paramKey}}}`, String(paramValue))
    })
  }

  return value
}
