// @mostajs/audit — AuditPage component
// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@mostajs/ui/card'
import { Button } from '@mostajs/ui/button'
import { Input } from '@mostajs/ui/input'
import { Badge } from '@mostajs/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mostajs/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@mostajs/ui/table'
import { FileText, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { t } from '../lib/i18n.js'

interface AuditEntry {
  id: string
  userName: string
  userRole: string
  action: string
  module: string
  resource: string
  resourceId: string
  details: unknown
  status: string
  timestamp: string
}

const MODULES = [
  'clients', 'tickets', 'scan', 'lockers', 'rfid',
  'access', 'users', 'activities', 'plans', 'settings',
]

const MODULE_COLORS: Record<string, string> = {
  clients: 'bg-blue-100 text-blue-800',
  tickets: 'bg-amber-100 text-amber-800',
  scan: 'bg-green-100 text-green-800',
  lockers: 'bg-purple-100 text-purple-800',
  rfid: 'bg-cyan-100 text-cyan-800',
  access: 'bg-orange-100 text-orange-800',
  users: 'bg-red-100 text-red-800',
  activities: 'bg-teal-100 text-teal-800',
  plans: 'bg-indigo-100 text-indigo-800',
  settings: 'bg-gray-100 text-gray-800',
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [moduleFilter, setModuleFilter] = useState<string>('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  async function fetchLogs() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' })
      if (moduleFilter) params.set('module', moduleFilter)
      if (actionFilter) params.set('action', actionFilter)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const res = await fetch(`/api/audit-log?${params}`)
      const data = await res.json()
      setLogs(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, moduleFilter])

  function handleSearch() {
    setPage(1)
    fetchLogs()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('audit.title')}</h1>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Select
              value={moduleFilter}
              onValueChange={(v: string) => { setModuleFilter(v === 'all' ? '' : v); setPage(1) }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('audit.filters.module')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les modules</SelectItem>
                {MODULES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {t(`audit.modules.${m}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder={t('audit.filters.action')}
              value={actionFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActionFilter(e.target.value)}
              className="w-[200px]"
            />

            <Input
              type="date"
              value={dateFrom}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFrom(e.target.value)}
              className="w-[160px]"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateTo(e.target.value)}
              className="w-[160px]"
            />

            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              Filtrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('audit.title')} ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-gray-400">Chargement...</div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-gray-400">Aucune entr&eacute;e</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Date</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Ressource</TableHead>
                  <TableHead className="w-[80px]">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{log.userName}</div>
                      <div className="text-xs text-gray-400">{log.userRole}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={MODULE_COLORS[log.module] || 'bg-gray-100 text-gray-800'}>
                        {log.module}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.action}</TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {log.resource && `${log.resource}`}
                      {log.resourceId && ` #${log.resourceId.slice(-6)}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {page} / {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
