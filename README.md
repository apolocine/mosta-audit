# @mostajs/audit

> Reusable audit logging module — fire-and-forget `logAudit()` with paginated consultation.

[![npm version](https://img.shields.io/npm/v/@mostajs/audit.svg)](https://www.npmjs.com/package/@mostajs/audit)
[![license](https://img.shields.io/npm/l/@mostajs/audit.svg)](LICENSE)

Part of the [@mosta suite](https://mostajs.dev).

---

## Installation

```bash
npm install @mostajs/audit @mostajs/orm
```

## Quick Start

### 1. Register the schema

```typescript
import { registerSchema } from '@mostajs/orm'
import { AuditLogSchema } from '@mostajs/audit'

registerSchema(AuditLogSchema)
```

### 2. Log an audit event

```typescript
import { logAudit } from '@mostajs/audit'

await logAudit({
  userId: session.user.id,
  userName: session.user.name,
  userRole: 'admin',
  action: 'create',
  module: 'users',
  resource: 'User',
  resourceId: newUser.id,
})
```

### 3. Query audit logs (API route)

```typescript
import { createAuditHandlers } from '@mostajs/audit'
import { checkPermission } from '@/lib/auth'

export const { GET } = createAuditHandlers('audit:view', checkPermission)
```

## API Reference

| Export | Description |
|--------|-------------|
| `logAudit(params)` | Fire-and-forget audit entry |
| `getAuditUser(session)` | Extract user info from NextAuth session |
| `AuditLogRepository` | Repository with `findPaginated()`, `findByResource()`, `deleteOlderThan()` |
| `AuditLogSchema` | Entity schema for registration |
| `createAuditHandlers()` | API route factory for paginated consultation |

## Related Packages

- [@mostajs/orm](https://www.npmjs.com/package/@mostajs/orm) — Multi-dialect ORM (required)
- [@mostajs/auth](https://www.npmjs.com/package/@mostajs/auth) — Authentication & RBAC

## License

MIT — © 2025 Dr Hamid MADANI <drmdh@msn.com>
