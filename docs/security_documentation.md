# Lifeline Security Documentation

This document summarizes implemented security controls for the current backend (`apps/server`).

Last updated: 2026-03-24

## 1) Scope

In-scope components:

- REST API in `apps/server/src/features`
- Global middleware in `apps/server/src/app.ts` and `apps/server/src/middlewares`
- Realtime socket auth in `apps/server/src/realtime/notificationsSocket.ts`
- Audit trail in MongoDB `audit_logs` collection

## 2) Security objectives

- Prevent unauthorized access to protected resources.
- Enforce role and permission boundaries.
- Reduce abuse risk (brute-force, flood, replay attempts).
- Preserve integrity for verified dispatch records (including on-chain hash record).
- Maintain traceability through audit logging.

## 3) Implemented controls

## 3.1 Authentication

- JWT access token issue/verify:
  - `apps/server/src/utils/jwt.ts`
- Token extraction from bearer header or auth cookie:
  - `apps/server/src/features/auth/authCookie.ts`
- Token revocation on logout (`jti` blocklist):
  - `apps/server/src/features/auth/TokenBlocklist.model.ts`
  - `apps/server/src/middlewares/requireAuth.ts`
- Admin MFA challenge and verify:
  - `apps/server/src/utils/mfa.ts`
  - `apps/server/src/features/auth/auth.controller.ts`

## 3.2 Authorization

- Role gate middleware:
  - `apps/server/src/middlewares/requireRole.ts`
- Permission gate middleware (RBAC profiles + user overrides):
  - `apps/server/src/middlewares/requirePerm.ts`
- Admin tier gate (`SUPER`, `CDRRMO`):
  - `apps/server/src/middlewares/requireAdminTier.ts`

## 3.3 Request validation and sanitization

- Zod request validation (`validate` middleware) across auth, emergency, dispatch, routing, and admin routes.
- NoSQL key hardening and Mongo sanitize:
  - `@exortek/express-mongo-sanitize` in `apps/server/src/app.ts`
- Additional parameter key sanitation (`$` and `.` replacement) in app-level middleware.

## 3.4 CSRF and browser protections

- Double-submit CSRF cookie strategy:
  - `apps/server/src/middlewares/csrf.ts`
- CSRF endpoint:
  - `GET /api/security/csrf`
- CSRF enforced for unsafe browser-origin requests only.
- Helmet and HPP enabled globally in `apps/server/src/app.ts`.

## 3.5 Abuse protection

- Route-specific rate limiting in `apps/server/src/middlewares/rateLimit.ts`.
- Rate-limit hits are logged as security audit events.

## 3.6 Upload and file handling

- Dispatch proof and emergency photo endpoints validate filenames via `path.basename`.
- Uploaded proof payload size and mime constraints validated by schema.
- Stored file payloads are read through AES-GCM decrypt path when encrypted:
  - `apps/server/src/utils/aesGcm.ts`

## 3.7 Audit logging

- Structured audit constants and event severities:
  - `apps/server/src/features/audit/audit.constants.ts`
- Logging helpers and sensitive-field sanitization:
  - `apps/server/src/features/audit/audit.service.ts`
- Audit query endpoints protected by role, tier, and permission checks.

## 3.8 Realtime channel security

- Socket authentication verifies JWT and token blocklist before connection.
- Room joins for request tracking are authorization-checked.
- Presence/location updates are role-constrained for approved volunteers.

## 3.9 Dispatch verification integrity

- Verified dispatches store hash-based blockchain record (`blockchain` and legacy `chainRecord`).
- Verify/revoke/reverify flows are role-gated (`LGU|ADMIN` for verify, `ADMIN` for revoke/reverify).
- Contract calls require explicit env-based RPC, key, and contract configuration.

## 4) Operational controls

- CORS allowlist from `CORS_ORIGINS`.
- Production `autoIndex` disabled in Mongoose (`apps/server/src/config/db.ts`).
- Request JSON body size cap configurable with `JSON_BODY_LIMIT`.
- Auth cookies are `httpOnly` with configurable secure/samesite behavior.

## 5) Verification checklist (quick)

1. Auth rejection test
   - Call protected route without token -> `401`.
2. Role denial test
   - Call LGU-only route as volunteer -> `403`.
3. Permission denial test
   - Remove required perm from role profile and retry protected admin endpoint -> `403`.
4. CSRF test
   - Browser-origin unsafe request without `x-csrf-token` -> `403` with `CSRF_INVALID`.
5. Rate limit test
   - Burst login requests until `429`.
6. Logout invalidation
   - `POST /api/auth/logout` then reuse same token -> `401`.
7. Audit visibility
   - Query `/api/audit` and verify event entries exist.

## 6) Known limitations and out-of-scope items

- No dedicated threat-model diagram file is currently stored in this repo.
- Encryption-at-rest policy for entire MongoDB volume is infrastructure-dependent and not enforced in app code.
- Multi-node Socket.IO consistency requires external adapter/sticky sessions in clustered deployments.
- AES key rotation for existing encrypted uploads requires planned migration.

## 7) Evidence map

- Security middleware and app wiring: `apps/server/src/app.ts`
- Auth middleware: `apps/server/src/middlewares/requireAuth.ts`
- Role middleware: `apps/server/src/middlewares/requireRole.ts`
- Permission middleware: `apps/server/src/middlewares/requirePerm.ts`
- CSRF middleware: `apps/server/src/middlewares/csrf.ts`
- Rate limiting: `apps/server/src/middlewares/rateLimit.ts`
- Audit routes and services:
  - `apps/server/src/features/audit/audit.routes.ts`
  - `apps/server/src/features/audit/audit.service.ts`
- Dispatch routes and blockchain integration:
  - `apps/server/src/features/dispatches/dispatch.routes.ts`
  - `apps/server/src/features/blockchain/taskLedger.ts`
- Realtime auth and authorization:
  - `apps/server/src/realtime/notificationsSocket.ts`
