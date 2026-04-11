# @mostajs/audit

> Fire-and-forget audit logging with paginated consultation.
> Author: Dr Hamid MADANI drmdh@msn.com

## Install

```bash
npm install @mostajs/audit @mostajs/orm
```

## How to Use

### 1. Log an Action

```typescript
import { logAudit, getAuditUser } from '@mostajs/audit'

await logAudit({
  ...getAuditUser(session),
  action: 'user_create',
  module: 'users',
  resource: 'John Doe',
  resourceId: user.id,
  details: { email: 'john@test.com' },
})
// Fire-and-forget — never throws, never blocks
```

### 2. API Handler (paginated consultation)

```typescript
import { createAuditHandlers } from '@mostajs/audit/api/route'
export const { GET } = createAuditHandlers('audit:view', checkPermission)
// GET /api/audit-log?page=1&limit=50&module=users&action=create
```

### 3. Module Info (for @mostajs/setup)

```typescript
import { getSchemas } from '@mostajs/audit/lib/module-info'
const schemas = getSchemas() // [AuditLogSchema]
```

### 4. Dual ORM/NET Mode

Works automatically via `getAuditRepo()` — reads `MOSTA_DATA=orm|net` from environment.
