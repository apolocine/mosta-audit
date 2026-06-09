// @mosta/audit — Volatile debug logger
// Author: Dr Hamid MADANI <drmdh@msn.com>
//
// Logger de debug structuré complémentaire de `logAudit` :
// - `logAudit` persiste en DB → traçabilité long-terme, consultation /admin.
// - `dlog` / `dwarn` poussent sur stdout/stderr → grep en pm2 logs, désactivable.
//
// Activation :
// - Si `MOSTAJS_DEBUG=1` ou `=true` → activé (toutes envs).
// - Si `MOSTAJS_DEBUG=0` ou `=false` → désactivé explicitement.
// - Sinon : activé en non-production (`NODE_ENV !== 'production'`).
//
// Usage générique :
// ```ts
// import { dlog, dwarn } from '@mostajs/audit'
// dlog('myapp.scope', { key: 'value' })   // → [myapp.scope] { ... }
// ```
//
// Usage avec namespace dédié à une app :
// ```ts
// import { createLogger } from '@mostajs/audit'
// export const { dlog, dwarn } = createLogger('iquesta')
// // dlog('magic.enter', { ... })          → [iquesta.magic.enter] { ... }
// ```

const ENABLED: boolean = (() => {
  const flag = process.env.MOSTAJS_DEBUG
  if (flag === '1' || flag === 'true') return true
  if (flag === '0' || flag === 'false') return false
  return process.env.NODE_ENV !== 'production'
})()

function emit(level: 'info' | 'warn', scope: string, data: Record<string, unknown>): void {
  // dwarn s'affiche même en prod (utile pour les erreurs critiques).
  // dlog est gated par ENABLED.
  if (level === 'info' && !ENABLED) return
  const payload = { ts: new Date().toISOString(), ...data }
  const target = level === 'warn' ? console.warn : console.info
  try { target(`[${scope}]`, JSON.stringify(payload)) }
  catch { target(`[${scope}]`, payload) }
}

/** Log debug — actif uniquement si MOSTAJS_DEBUG=1 ou hors prod. */
export function dlog(scope: string, data: Record<string, unknown>): void {
  emit('info', scope, data)
}

/** Log warning — toujours actif (utile en prod pour les erreurs critiques). */
export function dwarn(scope: string, data: Record<string, unknown>): void {
  emit('warn', scope, data)
}

export interface ScopedLogger {
  dlog: (scope: string, data: Record<string, unknown>) => void
  dwarn: (scope: string, data: Record<string, unknown>) => void
}

/**
 * Crée un logger avec un préfixe namespace fixe — utile pour différencier
 * les apps qui consomment le module dans le même environnement
 * (ex: pm2 logs avec plusieurs services partageant la même console).
 */
export function createLogger(namespace: string): ScopedLogger {
  return {
    dlog: (scope, data) => emit('info', `${namespace}.${scope}`, data),
    dwarn: (scope, data) => emit('warn', `${namespace}.${scope}`, data),
  }
}

/** Pour les tests ou les apps qui veulent contrôler l'activation. */
export function isDebugEnabled(): boolean {
  return ENABLED
}
