# @mostajs/audit

> Reusable audit logging module — fire-and-forget `logAudit()` with paginated consultation.

[![npm version](https://img.shields.io/npm/v/@mostajs/audit.svg)](https://www.npmjs.com/package/@mostajs/audit)
[![license](https://img.shields.io/npm/l/@mostajs/audit.svg)](LICENSE)

Part of the [@mosta suite](https://mostajs.dev). Depend de `@mostajs/orm` pour l'abstraction multi-dialecte (MongoDB, PostgreSQL, MySQL, SQLite, etc.).

---

## Table des matieres

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Integration complete dans une nouvelle app](#integration-complete)
4. [logAudit — Journalisation fire-and-forget](#logaudit)
5. [getAuditUser — Extraction session](#getaudituser)
6. [AuditLogRepository — Requetes avancees](#auditlogrepository)
7. [createAuditHandlers — Route API factory](#createaudithandlers)
8. [Schema et indexes](#schema-et-indexes)
9. [Cas d'usage courants](#cas-dusage-courants)
10. [API Reference](#api-reference)
11. [Architecture](#architecture)

---

## Installation

```bash
npm install @mostajs/audit @mostajs/orm
```

`@mostajs/orm` est la seule dependance requise. Elle gere la connexion DB et les operations CRUD quel que soit le dialecte (MongoDB, PostgreSQL, MySQL, SQLite, etc.).

---

## Quick Start

```typescript
import { logAudit } from '@mostajs/audit'

// Fire-and-forget — ne throw jamais, ne bloque jamais
await logAudit({
  userId: '507f1f77bcf86cd799439011',
  userName: 'Dr Madani',
  userRole: 'admin',
  action: 'create',
  module: 'users',
  resource: 'User',
  resourceId: 'abc123',
  details: { email: 'new@example.com' },
})
```

C'est tout. Le schema est auto-enregistre dans l'ORM, la table/collection est creee automatiquement.

---

## Integration complete

Guide pas-a-pas pour integrer `@mostajs/audit` dans une nouvelle application Next.js.

### Etape 1 — Installer les packages

```bash
npm install @mostajs/audit @mostajs/orm
```

### Etape 2 — Configurer la connexion DB

L'ORM doit etre configure avant d'utiliser audit. Dans votre `.env.local` :

```env
DATABASE_URL=mongodb://localhost:27017/myapp
# ou: DATABASE_URL=postgres://user:pass@localhost:5432/myapp
# ou: DATABASE_URL=sqlite:./data/myapp.db
```

Initialiser l'ORM (une seule fois, au demarrage) :

```typescript
// src/lib/db.ts
import { initDialect } from '@mostajs/orm'

let initialized = false

export async function ensureDB() {
  if (initialized) return
  await initDialect(process.env.DATABASE_URL!)
  initialized = true
}
```

### Etape 3 — Utiliser logAudit dans vos routes API

```typescript
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { logAudit, getAuditUser } from '@mostajs/audit/lib/audit'
import { ensureDB } from '@/lib/db'
import { getServerSession } from 'next-auth'

export async function POST(req: NextRequest) {
  await ensureDB()
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const body = await req.json()

  // ... creer le produit dans la DB ...
  const product = { id: 'prod_123', name: body.name }

  // Journaliser l'action — fire-and-forget
  await logAudit({
    ...getAuditUser(session),
    action: 'create',
    module: 'products',
    resource: 'Product',
    resourceId: product.id,
    details: { name: product.name },
  })

  return NextResponse.json({ data: product })
}
```

### Etape 4 — Route de consultation des logs

```typescript
// src/app/api/admin/audit/route.ts
import { createAuditHandlers } from '@mostajs/audit/api/route'
import { checkPermission } from '@/lib/auth'

export const { GET } = createAuditHandlers('audit:view', checkPermission)
```

Cette route expose `GET /api/admin/audit` avec pagination et filtres automatiques.

### Etape 5 — Page d'administration (frontend)

```tsx
'use client'
import { useState, useEffect } from 'react'

interface AuditLog {
  id: string
  userName: string
  action: string
  module: string
  resource: string
  timestamp: string
  status: 'success' | 'failure'
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 })
  const [module, setModule] = useState('')

  async function fetchLogs(page = 1) {
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (module) params.set('module', module)

    const res = await fetch(`/api/admin/audit?${params}`)
    const json = await res.json()
    setLogs(json.data)
    setMeta(json.meta)
  }

  useEffect(() => { fetchLogs() }, [module])

  return (
    <div>
      <h1>Journal d'audit</h1>

      {/* Filtre par module */}
      <select value={module} onChange={e => setModule(e.target.value)}>
        <option value="">Tous les modules</option>
        <option value="users">Utilisateurs</option>
        <option value="products">Produits</option>
        <option value="orders">Commandes</option>
      </select>

      {/* Table des logs */}
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Utilisateur</th>
            <th>Action</th>
            <th>Module</th>
            <th>Ressource</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td>{log.userName}</td>
              <td>{log.action}</td>
              <td>{log.module}</td>
              <td>{log.resource}</td>
              <td>{log.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div>
        <button
          disabled={meta.page <= 1}
          onClick={() => fetchLogs(meta.page - 1)}
        >Precedent</button>
        <span>Page {meta.page} / {meta.pages} ({meta.total} total)</span>
        <button
          disabled={meta.page >= meta.pages}
          onClick={() => fetchLogs(meta.page + 1)}
        >Suivant</button>
      </div>
    </div>
  )
}
```

### Etape 6 — Verification

```bash
# Demarrer l'app
npm run dev

# Creer un produit (declenche un audit log)
curl -X POST http://localhost:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{"name": "Widget"}'

# Consulter les logs
curl 'http://localhost:3000/api/admin/audit?limit=5'
```

Reponse attendue :

```json
{
  "data": [
    {
      "id": "...",
      "userName": "Dr Madani",
      "userRole": "admin",
      "action": "create",
      "module": "products",
      "resource": "Product",
      "resourceId": "prod_123",
      "details": { "name": "Widget" },
      "status": "success",
      "timestamp": "2026-03-05T14:30:00.000Z"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 5, "pages": 1 }
}
```

---

## logAudit

```typescript
import { logAudit } from '@mostajs/audit/lib/audit'
```

Journalise une action. **Fire-and-forget** : ne throw jamais, ne bloque jamais. Si l'ecriture echoue, l'erreur est loggee dans la console sans interrompre le flux.

```typescript
await logAudit({
  userId: '507f1f77bcf86cd799439011',
  userName: 'Alice',
  userRole: 'manager',
  action: 'update',
  module: 'clients',
  resource: 'Client',
  resourceId: 'cli_456',
  details: { field: 'status', oldValue: 'active', newValue: 'suspended' },
  ipAddress: '192.168.1.100',
  status: 'success',       // 'success' | 'failure' (defaut: 'success')
})
```

### Parametres (AuditParams)

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `userId` | `string` | oui | ID de l'utilisateur |
| `userName` | `string` | oui | Nom affichable |
| `userRole` | `string` | oui | Role (admin, manager, etc.) |
| `action` | `string` | oui | Action effectuee (create, update, delete, login, etc.) |
| `module` | `string` | oui | Module concerne (users, clients, lockers, etc.) |
| `resource` | `string` | non | Type de ressource (User, Client, etc.) |
| `resourceId` | `string` | non | ID de la ressource |
| `details` | `Record<string, any>` | non | Donnees supplementaires |
| `ipAddress` | `string` | non | Adresse IP du client |
| `status` | `'success' \| 'failure'` | non | Resultat (defaut: `'success'`) |

---

## getAuditUser

```typescript
import { getAuditUser } from '@mostajs/audit/lib/audit'
```

Extrait `userId`, `userName` et `userRole` d'une session NextAuth. Compatible avec tout objet session ayant `session.user.id`, `session.user.name` et `session.user.role`.

```typescript
const session = await getServerSession()

await logAudit({
  ...getAuditUser(session),  // { userId, userName, userRole }
  action: 'delete',
  module: 'products',
  resourceId: productId,
})
```

Le helper gere les cas :
- `session.user.role` (string) → utilise directement
- `session.user.roles` (array) → joint avec `, `
- Ni l'un ni l'autre → `'unknown'`
- `session.user.name` absent → utilise `session.user.email`

---

## AuditLogRepository

```typescript
import { AuditLogRepository } from '@mostajs/audit'
import { getDialect } from '@mostajs/orm'

const repo = new AuditLogRepository(await getDialect())
```

### findPaginated(filters)

Recherche paginee avec filtres optionnels.

```typescript
const { data, total } = await repo.findPaginated({
  module: 'users',              // Filtrer par module
  action: 'delete',             // Filtrer par action (regex, case-insensitive)
  userId: '507f1f77...',        // Filtrer par utilisateur
  status: 'failure',            // Filtrer par statut
  from: new Date('2026-01-01'), // Date debut
  to: new Date('2026-03-01'),   // Date fin
  page: 2,                      // Page (defaut: 1)
  limit: 20,                    // Limite (defaut: 50)
})

console.log(`${total} logs trouves, page 2`)
data.forEach(log => console.log(log.action, log.module, log.timestamp))
```

### findByResource(resourceId, modules?)

Tous les logs lies a une ressource specifique.

```typescript
// Tous les logs du client CLI_123
const logs = await repo.findByResource('CLI_123')

// Logs du client CLI_123 dans les modules 'clients' et 'lockers'
const filtered = await repo.findByResource('CLI_123', ['clients', 'lockers'])
```

### deleteOlderThan(days)

Nettoyage des anciens logs. Utile en cron job ou maintenance.

```typescript
// Supprimer les logs de plus de 90 jours
const deleted = await repo.deleteOlderThan(90)
console.log(`${deleted} logs supprimes`)
```

---

## createAuditHandlers

```typescript
import { createAuditHandlers } from '@mostajs/audit/api/route'
```

Factory pour creer une route `GET` paginee avec controle d'acces.

```typescript
// src/app/api/admin/audit/route.ts
import { createAuditHandlers } from '@mostajs/audit/api/route'
import { checkPermission } from '@/lib/auth'

export const { GET } = createAuditHandlers('audit:view', checkPermission)
```

### Signature du checkPermission attendu

```typescript
type PermissionChecker = (permission: string) => Promise<{
  error: NextResponse | null   // null = autorise
  session: any                 // session utilisateur
}>
```

### Query params supportes

| Param | Type | Description |
|-------|------|-------------|
| `module` | string | Filtrer par module |
| `action` | string | Filtrer par action (regex) |
| `userId` | string | Filtrer par utilisateur |
| `status` | `success \| failure` | Filtrer par statut |
| `from` | ISO date | Date debut |
| `to` | ISO date | Date fin |
| `page` | number | Numero de page (defaut: 1) |
| `limit` | number | Elements par page (defaut: 50) |

### Exemples de requetes

```bash
# Tous les logs, page 1
GET /api/admin/audit

# Logs du module 'users', page 2, 20 par page
GET /api/admin/audit?module=users&page=2&limit=20

# Logs en echec du dernier mois
GET /api/admin/audit?status=failure&from=2026-02-01&to=2026-03-01

# Logs d'un utilisateur specifique
GET /api/admin/audit?userId=507f1f77bcf86cd799439011
```

---

## Schema et indexes

La collection/table `auditlogs` est creee automatiquement avec le schema suivant :

| Champ | Type | Requis | Defaut |
|-------|------|--------|--------|
| `userId` | relation → User | oui | — |
| `userName` | string | oui | — |
| `userRole` | string | oui | — |
| `action` | string | oui | — |
| `module` | string | oui | — |
| `resource` | string | non | `''` |
| `resourceId` | string | non | `''` |
| `details` | json | non | — |
| `ipAddress` | string | non | `''` |
| `status` | enum: success, failure | non | `'success'` |
| `timestamp` | date | non | `now` |

### Indexes

| Index | Champs | Usage |
|-------|--------|-------|
| 1 | `{ timestamp: desc }` | Tri chronologique |
| 2 | `{ module: asc, timestamp: desc }` | Filtrage par module |
| 3 | `{ userId: asc, timestamp: desc }` | Historique utilisateur |

Compatible avec tous les dialectes supportes par `@mostajs/orm` (MongoDB, PostgreSQL, MySQL, SQLite, MariaDB, MSSQL, Oracle, etc.).

---

## Cas d'usage courants

### Auditer les operations CRUD

```typescript
// Dans chaque route API
export async function POST(req: NextRequest) {
  const { error, session } = await checkPermission(PERMISSIONS.CLIENT_CREATE)
  if (error) return error

  const data = await req.json()
  const client = await clientRepo.create(data)

  // Audit
  await logAudit({
    ...getAuditUser(session),
    action: 'create',
    module: 'clients',
    resource: 'Client',
    resourceId: client.id,
    details: { firstName: data.firstName, lastName: data.lastName },
  })

  return NextResponse.json({ data: client })
}
```

### Auditer les connexions

```typescript
// Dans le callback NextAuth signIn
import { logAudit } from '@mostajs/audit/lib/audit'

callbacks: {
  async signIn({ user }) {
    await logAudit({
      userId: user.id,
      userName: user.name || user.email,
      userRole: user.role || 'user',
      action: 'login',
      module: 'auth',
    })
    return true
  }
}
```

### Auditer les echecs

```typescript
try {
  await dangerousOperation()
  await logAudit({ ...getAuditUser(session), action: 'export_data', module: 'reports', status: 'success' })
} catch (err) {
  await logAudit({ ...getAuditUser(session), action: 'export_data', module: 'reports', status: 'failure', details: { error: err.message } })
  throw err
}
```

### Nettoyage automatique (cron)

```typescript
// src/app/api/cron/cleanup-audit/route.ts
import { AuditLogRepository } from '@mostajs/audit'
import { getDialect } from '@mostajs/orm'

export async function POST() {
  const repo = new AuditLogRepository(await getDialect())
  const deleted = await repo.deleteOlderThan(180) // 6 mois
  return Response.json({ data: { deleted } })
}
```

### Historique d'une ressource

```typescript
// src/app/api/clients/[id]/history/route.ts
import { AuditLogRepository } from '@mostajs/audit'
import { getDialect } from '@mostajs/orm'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const repo = new AuditLogRepository(await getDialect())
  const logs = await repo.findByResource(params.id, ['clients', 'lockers', 'rfid'])
  return Response.json({ data: logs })
}
```

---

## API Reference

### Core

| Export | Import | Description |
|--------|--------|-------------|
| `logAudit(params)` | `@mostajs/audit/lib/audit` | Fire-and-forget audit logging |
| `getAuditUser(session)` | `@mostajs/audit/lib/audit` | Extraire userId/userName/userRole |

### Data Layer

| Export | Import | Description |
|--------|--------|-------------|
| `AuditLogRepository` | `@mostajs/audit` | Repository avec findPaginated, findByResource, deleteOlderThan |
| `AuditLogSchema` | `@mostajs/audit` | Schema d'entite ORM |

### Route Factory

| Export | Import | Description |
|--------|--------|-------------|
| `createAuditHandlers(perm, checker)` | `@mostajs/audit/api/route` | Factory GET pagine avec auth |

### Types

| Type | Description |
|------|-------------|
| `AuditParams` | Parametres de logAudit() |
| `AuditFilters` | Filtres pour findPaginated() |
| `AuditLogDTO` | Objet retourne (id, userName, action, module, timestamp, ...) |
| `MostaAuditConfig` | Config optionnelle (modules, actions connus) |

---

## Architecture

```
@mostajs/audit
├── lib/
│   └── audit.ts                # logAudit() + getAuditUser()
├── api/
│   └── route.ts                # createAuditHandlers() factory
├── repositories/
│   └── audit-log.repository.ts # findPaginated, findByResource, deleteOlderThan
├── schemas/
│   └── audit-log.schema.ts     # EntitySchema ORM (collection: auditlogs)
├── types/
│   └── index.ts                # AuditParams, AuditFilters, AuditLogDTO
└── index.ts                    # Barrel exports

Dependances :
  @mostajs/orm   (required — abstraction DB multi-dialecte)
  next >= 14     (peer, optionnel — pour createAuditHandlers)
```

### Pattern d'injection

```
┌─────────────────────┐     inject permission       ┌──────────────────────┐
│   @mostajs/audit    │ ◄───────────────────────── │   Votre app          │
│                     │                             │                      │
│ createAuditHandlers(│                             │ 'audit:view',        │
│   permission,       │                             │ checkPermission      │
│   checkPermission   │                             │                      │
│ )                   │                             │                      │
└─────────────────────┘                             └──────────────────────┘

┌─────────────────────┐     call anywhere           ┌──────────────────────┐
│   logAudit({...})   │ ◄───────────────────────── │ Route API, callback, │
│   fire-and-forget   │                             │ middleware, cron...  │
└─────────────────────┘                             └──────────────────────┘
```
                                                                     
  Modifications effectuees :                                                        
                                                                                    
  1. README.md — Tutoriel complet avec :                                            
    - Integration pas-a-pas dans une nouvelle app (6 etapes)                        
    - Documentation detaillee de logAudit, getAuditUser, AuditLogRepository,        
  createAuditHandlers                                                               
    - Schema et indexes documentes
    - 5 cas d'usage courants (CRUD, login, echecs, cron cleanup, historique         
  ressource)                                                                        
    - API Reference, architecture ASCII, pattern d'injection                        
  2. package.json — Ajout des subpath exports manquants : ./lib/*, ./api/*, ./types 
  (corrige l'import @mostajs/audit/lib/audit utilise dans 15 routes de l'app)       


---

## License

MIT — Dr Hamid MADANI <drmdh@msn.com>
