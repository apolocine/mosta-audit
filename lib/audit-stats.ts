// @mostajs/audit — Audit statistics helpers
// Author: Dr Hamid MADANI drmdh@msn.com

export interface AuditStats {
  totalLogs: number
  byModule: Record<string, number>
  byAction: Record<string, number>
  byStatus: { success: number; failure: number }
  topUsers: { userName: string; count: number }[]
  recentErrors: any[]
}

export async function getAuditStats(repo: any, days: number = 30): Promise<AuditStats> {
  const cutoff = new Date(Date.now() - days * 86400000)

  // Get all logs in period
  const { data, total } = await repo.findPaginated({
    page: 1,
    limit: 10000,
    dateFrom: cutoff.toISOString(),
  })

  const byModule: Record<string, number> = {}
  const byAction: Record<string, number> = {}
  const byStatus = { success: 0, failure: 0 }
  const userCounts: Record<string, number> = {}

  for (const log of data) {
    byModule[log.module] = (byModule[log.module] ?? 0) + 1
    byAction[log.action] = (byAction[log.action] ?? 0) + 1
    if (log.status === 'success') byStatus.success++
    else byStatus.failure++
    if (log.userName) userCounts[log.userName] = (userCounts[log.userName] ?? 0) + 1
  }

  const topUsers = Object.entries(userCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userName, count]) => ({ userName, count }))

  const recentErrors = data
    .filter((l: any) => l.status === 'failure')
    .slice(0, 20)

  return { totalLogs: total, byModule, byAction, byStatus, topUsers, recentErrors }
}
