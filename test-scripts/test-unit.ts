// @mostajs/audit — Tests unitaires (no DB needed)
// Author: Dr Hamid MADANI drmdh@msn.com

import {
  auditToCsv,
  auditToJson,
} from '../lib/export.js'

let passed = 0
let failed = 0

function assert(condition: boolean, label: string) {
  if (condition) { passed++; console.log('  ✅', label) }
  else { failed++; console.error('  ❌', label) }
}

async function run() {

  // ── T1 — CSV export ──
  console.log('T1 — CSV export')
  const sampleLogs = [
    {
      timestamp: '2026-04-01T10:00:00.000Z',
      userName: 'admin', userRole: 'superadmin',
      module: 'cloud', action: 'project_create',
      resource: 'Project', resourceId: 'proj-1',
      status: 'success', ipAddress: '192.168.1.1',
      details: { name: 'MyProject' },
    },
    {
      timestamp: '2026-04-02T12:00:00.000Z',
      userName: 'user1', userRole: 'admin',
      module: 'billing', action: 'payment_success',
      resource: 'Subscription', resourceId: 'sub-42',
      status: 'success', ipAddress: '10.0.0.5',
      details: null,
    },
  ]
  const csv = auditToCsv(sampleLogs)
  const lines = csv.split('\n')
  assert(lines.length === 3, 'CSV has 3 lines (header + 2 rows)')
  assert(lines[0] === 'timestamp,userName,userRole,module,action,resource,resourceId,status,ipAddress,details', 'CSV header correct')
  assert(lines[1].includes('admin'), 'row 1 contains admin')
  assert(lines[2].includes('user1'), 'row 2 contains user1')
  console.log('')

  // ── T2 — JSON export ──
  console.log('T2 — JSON export')
  const json = auditToJson(sampleLogs)
  const parsed = JSON.parse(json)
  assert(Array.isArray(parsed), 'JSON output is array')
  assert(parsed.length === 2, 'JSON has 2 entries')
  assert(parsed[0].userName === 'admin', 'first entry userName = admin')
  console.log('')

  // ── T3 — CSV empty ──
  console.log('T3 — CSV empty')
  assert(auditToCsv([]) === '', 'empty array → empty string')
  console.log('')

  // ── T4 — CSV escaping ──
  console.log('T4 — CSV escaping')
  const logsWithComma = [{
    timestamp: '2026-04-01T10:00:00.000Z',
    userName: 'user, with comma', userRole: 'admin',
    module: 'cloud', action: 'project_create',
    resource: 'Project', resourceId: 'proj-1',
    status: 'success', ipAddress: '192.168.1.1', details: null,
  }]
  const csvEscaped = auditToCsv(logsWithComma)
  assert(csvEscaped.includes('"user, with comma"'), 'value with comma is quoted')
  console.log('')

  // ── Summary ──
  console.log('════════════════════════════════════════')
  console.log(`  Resultats: ${passed} passed, ${failed} failed`)
  console.log('════════════════════════════════════════')
  if (failed > 0) process.exit(1)
}

run().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1) })
