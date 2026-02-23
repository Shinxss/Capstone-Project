# Lifeline Server API

Lifeline Server is the backend for the Lifeline emergency volunteer response platform. It powers community SOS reporting, LGU dispatch coordination, volunteer application workflows, and admin-authenticated operations.

## Overview

This service exposes REST APIs used by the web (LGU/Admin) and mobile (community/volunteer) clients. It handles:
- authentication and role-based authorization
- emergency intake and reporting
- hazard zone management
- volunteer application review flow
- dispatch lifecycle (offer, respond, proof, complete, verify)
- audit logging for security-relevant actions

## Core Features

- Auth and identity
  - Community, LGU, and Admin login flows
  - JWT access tokens + server-side token blocklist on logout
  - Admin OTP/MFA verification
- Dispatch operations
  - LGU dispatch offer creation
  - Volunteer accept/decline/complete workflow
  - LGU task verification
- Hazard management
  - Hazard zone listing and LGU/Admin write operations
- Volunteer applications
  - Community submissions and LGU/Admin review endpoints
- Security and observability
  - CSRF enforcement for browser-origin unsafe requests
  - Rate limiting on auth-sensitive routes
  - Audit log records in `audit_logs`

## Tech Stack

- Runtime: Node.js + TypeScript
- Framework: Express
- Database: MongoDB + Mongoose
- Validation: Zod
- Security middleware: Helmet, HPP, CORS, `@exortek/express-mongo-sanitize`, `csrf-csrf`, `express-rate-limit`
- Crypto/Auth: `jsonwebtoken`, `bcryptjs`
- Email/OTP: Nodemailer

## Folder Structure

```text
apps/server
├─ src/
│  ├─ app.ts                 # Express app, global middleware, route mounting
│  ├─ server.ts              # process bootstrap and DB connection
│  ├─ config/                # DB configuration
│  ├─ middlewares/           # auth, role, CSRF, validation, rate limits
│  ├─ features/              # feature modules (auth, emergency, dispatches, etc.)
│  ├─ scripts/               # seed scripts
│  └─ utils/                 # JWT, mailer, crypto helpers
├─ docs/                     # security, API, deployment, maintenance docs
├─ uploads/                  # encrypted dispatch proof files
└─ .env.example              # environment variable template
```

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create your environment file from the template:

```bash
cp .env.example .env
```

3. Fill values in `.env` based on `.env.example`.

## Development and Build

- Run development server:

```bash
pnpm dev
```

- Build TypeScript output:

```bash
pnpm build
```

- Type check only:

```bash
pnpm typecheck
```

## Seeding Data

- Seed system super admin (creates/updates `ADMIN` with `adminTier=SUPER`):

```bash
pnpm run seed:system-admin
```

- Seed RBAC role profiles (`SUPER_ADMIN`, `CDRRMO_ADMIN`, `LGU_ADMIN`):

```bash
pnpm run seed:rbac
```

- Seed LGU accounts:

```bash
pnpm run seed:lgu
```

- Seed Dagupan barangays:

```bash
pnpm run seed:barangays
```

### Seed Environment Notes

- Mongo connection: seed scripts accept `MONGODB_URI` (preferred) and `MONGO_URI` (fallback).
- `seed:system-admin` expects:
  - `SYSTEM_ADMIN_USERNAME` (optional; defaults to `sysadmin`)
  - `SYSTEM_ADMIN_EMAIL` (required)
  - `SYSTEM_ADMIN_PASSWORD` (required)
- `seed:lgu` supports:
  - `SEED_LGU_DEFAULT_PASSWORD` (optional; defaults to `Lifeline@123`)
  - `SEED_LGU_MUNICIPALITY` (optional; defaults to `Dagupan City`)
  - `SEED_LGU_ACCOUNTS_JSON` (optional JSON array override for seeded LGU users)
- `seed:rbac` supports:
  - `SEED_RBAC_OVERWRITE` (`true` by default; set `false` to preserve existing permissions)
- Barangay seeds optionally use `BARANGAY_GEOJSON_PATH` to override GeoJSON input file.

## Security Overview

- JWT auth: Bearer token validation in `requireAuth` middleware
- Rate limiting: auth and OTP endpoints protected via `express-rate-limit`
- MFA/admin OTP: admin login requires OTP verification flow
- CSRF: double-submit cookie pattern for browser-origin unsafe methods
- NoSQL sanitization: global request key sanitization (`$`/`.` hardening)
- Upload validation: proof payload size, mime type, and magic-byte checks before storage

See:
- `docs/SECURITY_CHECKLIST_MAP.md`
- `docs/SECURITY_CHECKLIST_TESTS.md`

## Testing

Automated test suites are not currently configured in this package.

Recommended validation workflow:

1. Run static checks:

```bash
pnpm typecheck
```

2. Execute manual API/security checks from:
- `docs/SECURITY_CHECKLIST_TESTS.md`
- `docs/TROUBLESHOOTING.md`

## Additional Docs

Start at `docs/README.md` for API, deployment, maintenance, and troubleshooting references.
