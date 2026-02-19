# Lifeline Security Documentation

## 0) Scope and Audience
This document summarizes implemented backend security controls for the Lifeline capstone presentation and rubric review. It is written for instructors, evaluators, and maintainers who need evidence of what is currently in scope, how controls work, and how to verify them. Local development assumes non-production defaults may be used for convenience (for example, non-production HSTS behavior), while production assumptions require environment configuration for secrets, allowed origins, and deployment hardening.

## 1) System Overview
- **Clients:** Web app and mobile app call the backend API.
- **Backend:** Express + TypeScript API in [../src](../src).
- **Database:** MongoDB via Mongoose in [../src/config/db.ts](../src/config/db.ts).
- **Authentication model:** Stateless Bearer JWT access tokens with role claims (`ADMIN`, `LGU`, `VOLUNTEER`, `COMMUNITY`) and middleware enforcement in [../src/middlewares/requireAuth.ts](../src/middlewares/requireAuth.ts) and [../src/middlewares/requireRole.ts](../src/middlewares/requireRole.ts).
- **Trust boundaries:**
  - Untrusted client input enters via `/api` routes.
  - Security enforcement occurs in middleware and route handlers on the server.
  - Persistent state and audit artifacts are stored in MongoDB collections.

## 2) Threat Model Summary (Documentation Evidence)
- **Threat model document location:** A dedicated formal threat model file is **not currently present** in this repository.
- **DFD status:** A dedicated DFD file is **not currently present** in this repository.
- **Available security evidence:**
  - Security control mapping: [SECURITY_CHECKLIST_MAP.md](SECURITY_CHECKLIST_MAP.md)
  - Verification procedures: [SECURITY_CHECKLIST_TESTS.md](SECURITY_CHECKLIST_TESTS.md)
- **STRIDE/OWASP overview (current evidence-based mapping):**
  - **Spoofing / Broken Authentication:** JWT verification, role checks, rate limiting, OTP/MFA, and Google token verification.
  - **Tampering / Injection:** Zod validation plus request sanitization (`mongoSanitize`, key sanitization for `$` and `.`).
  - **Repudiation / Logging failures:** Append-only audit logging with request/correlation IDs.
  - **Information Disclosure:** Generic auth failure messages, sensitive-field redaction/masking in audit metadata.
  - **Denial of Service:** Auth and OTP rate limits.
  - **Elevation of Privilege:** RBAC (`requireRole`) on protected routes.

## 3) Authentication & Session Security

### Password hashing (bcrypt)
- **Protects against:** Plaintext credential exposure if user records are leaked.
- **Implemented in:**
  - [../src/features/auth/auth.service.ts](../src/features/auth/auth.service.ts)
  - [../src/features/auth/auth.community.routes.ts](../src/features/auth/auth.community.routes.ts)
  - [../src/features/auth/routes/signupOtp.routes.ts](../src/features/auth/routes/signupOtp.routes.ts)
  - [../src/features/auth/routes/passwordReset.routes.ts](../src/features/auth/routes/passwordReset.routes.ts)
  - [../src/features/auth/auth.google.controller.ts](../src/features/auth/auth.google.controller.ts)
- **How to verify:** Register or reset password flow, then confirm login works with hashed password comparison; see full scripts in [SECURITY_CHECKLIST_TESTS.md](SECURITY_CHECKLIST_TESTS.md).

### JWT verification + expiry
- **Protects against:** Unauthorized access using missing/invalid/expired tokens.
- **Implemented in:**
  - Token issue/verify: [../src/utils/jwt.ts](../src/utils/jwt.ts)
  - Enforcement: [../src/middlewares/requireAuth.ts](../src/middlewares/requireAuth.ts)
- **How to verify:** Call protected route without token (expect `401`), with invalid token (expect `401`), and with valid token (expect success based on role).

### Generic login errors
- **Protects against:** Account/user enumeration and credential oracle behavior.
- **Implemented in:**
  - [../src/features/auth/auth.controller.ts](../src/features/auth/auth.controller.ts)
  - [../src/features/auth/auth.community.routes.ts](../src/features/auth/auth.community.routes.ts)
  - [../src/features/auth/auth.lgu.routes.ts](../src/features/auth/auth.lgu.routes.ts)
  - [../src/features/auth/auth.google.controller.ts](../src/features/auth/auth.google.controller.ts)
- **How to verify:** Submit wrong email vs wrong password and confirm same invalid-credentials response pattern.

### Rate limiting for auth routes
- **Protects against:** Brute-force and OTP flooding.
- **Implemented in:**
  - Limiter definitions: [../src/middlewares/rateLimit.ts](../src/middlewares/rateLimit.ts)
  - Applied routes: [../src/features/auth/auth.routes.ts](../src/features/auth/auth.routes.ts), [../src/features/auth/auth.community.routes.ts](../src/features/auth/auth.community.routes.ts), [../src/features/auth/auth.lgu.routes.ts](../src/features/auth/auth.lgu.routes.ts)
- **How to verify:** Repeat login/OTP requests over threshold and confirm `429`.

### MFA/OTP
- **Protects against:** Single-factor compromise on admin flow and email-based verification/reset abuse.
- **Implemented in:**
  - Admin MFA challenge/verify: [../src/utils/mfa.ts](../src/utils/mfa.ts), [../src/features/auth/MfaChallenge.ts](../src/features/auth/MfaChallenge.ts), [../src/features/auth/auth.controller.ts](../src/features/auth/auth.controller.ts), [../src/features/auth/auth.admin.routes.ts](../src/features/auth/auth.admin.routes.ts), [../src/features/auth/auth.lgu.routes.ts](../src/features/auth/auth.lgu.routes.ts)
  - Signup/password OTP: [../src/features/auth/routes/signupOtp.routes.ts](../src/features/auth/routes/signupOtp.routes.ts), [../src/features/auth/routes/passwordReset.routes.ts](../src/features/auth/routes/passwordReset.routes.ts)
- **How to verify:** Request OTP, test invalid/expired code handling, then verify success flow.

### Logout invalidation (token revocation)
- **Protects against:** Reuse of a previously valid token after logout.
- **Implemented in:**
  - Logout endpoint: [../src/features/auth/auth.controller.ts](../src/features/auth/auth.controller.ts)
  - Revocation storage: [../src/features/auth/TokenBlocklist.model.ts](../src/features/auth/TokenBlocklist.model.ts)
  - Enforcement check: [../src/middlewares/requireAuth.ts](../src/middlewares/requireAuth.ts)
- **How to verify:** Login, call `POST /api/auth/logout`, then call protected endpoint with same token and confirm `401`.

### OAuth/Google login
- **Protects against:** Unverified or invalid external identity tokens.
- **Implemented in:**
  - Google auth handlers: [../src/features/auth/auth.google.controller.ts](../src/features/auth/auth.google.controller.ts)
  - Route: `POST /api/auth/google` in [../src/features/auth/auth.routes.ts](../src/features/auth/auth.routes.ts)
- **How to verify:** Provide invalid Google token (expect auth failure) and valid token flow (expect token + user payload).

### Demo script (presentation)
- Trigger auth rate limit on a login endpoint and show `429`.
- Login, call `POST /api/auth/logout`, then call `GET /api/auth/me` with same token and show `401`.
- Detailed command-level scripts: [SECURITY_CHECKLIST_TESTS.md](SECURITY_CHECKLIST_TESTS.md).

## 4) Input Validation & API Security
- **Server-side validation approach:** Zod schemas + reusable middleware in [../src/middlewares/validate.ts](../src/middlewares/validate.ts).
- **Schema coverage examples:**
  - Body validation (auth/emergency/dispatch): [../src/features/auth/auth.schemas.ts](../src/features/auth/auth.schemas.ts), [../src/features/emergency/emergency.routes.ts](../src/features/emergency/emergency.routes.ts), [../src/features/dispatches/dispatch.routes.ts](../src/features/dispatches/dispatch.routes.ts)
  - Query validation: `validate(..., "query")` in [../src/features/emergency/emergency.routes.ts](../src/features/emergency/emergency.routes.ts) and [../src/features/dispatches/dispatch.routes.ts](../src/features/dispatches/dispatch.routes.ts)
  - Params validation: `validate(..., "params")` in [../src/features/dispatches/dispatch.routes.ts](../src/features/dispatches/dispatch.routes.ts)
- **NoSQL injection prevention:**
  - `@exortek/express-mongo-sanitize` and key sanitization in [../src/app.ts](../src/app.ts)
  - `$` and `.` key hardening applied to body/query/params.
- **CSRF protection (browser-origin unsafe methods):**
  - Double-submit CSRF middleware in [../src/middlewares/csrf.ts](../src/middlewares/csrf.ts)
  - Global enforcement in [../src/app.ts](../src/app.ts)
  - Token endpoint: `GET /api/security/csrf` in [../src/features/security/security.routes.ts](../src/features/security/security.routes.ts)
  - Header used by web clients: `x-csrf-token` (declared in CORS allowed headers in [../src/app.ts](../src/app.ts))
  - Mobile/non-browser requests are bypassed by design when `Origin/Referer` is absent.
- **How to verify:** Use the CSRF test scenarios in [SECURITY_CHECKLIST_TESTS.md](SECURITY_CHECKLIST_TESTS.md).

## 5) Database Security & Hardening
- **Credential handling:**
  - Runtime secrets and DB URI are loaded from environment variables in [../src/server.ts](../src/server.ts).
  - Environment files/secrets are ignored by git in [../../../.gitignore](../../../.gitignore) and [../.gitignore](../.gitignore).
- **Role-based access control:** `requireRole` middleware enforces route-level role checks and logs denied access in [../src/middlewares/requireRole.ts](../src/middlewares/requireRole.ts).
- **Audit logging:**
  - Events and schema: [../src/features/audit/audit.constants.ts](../src/features/audit/audit.constants.ts), [../src/features/audit/audit.model.ts](../src/features/audit/audit.model.ts)
  - Logging and sanitization: [../src/features/audit/audit.service.ts](../src/features/audit/audit.service.ts)
  - Query endpoints: [../src/features/audit/audit.routes.ts](../src/features/audit/audit.routes.ts)
  - Storage collection: `audit_logs`.
- **Database hardening:**
  - Mongoose strict query + connection options in [../src/config/db.ts](../src/config/db.ts)
  - Schema strict mode (`strict: "throw"`) in user/audit models (for example [../src/features/users/user.model.ts](../src/features/users/user.model.ts), [../src/features/audit/audit.model.ts](../src/features/audit/audit.model.ts))
  - Append-only protection on audit collection write/delete operations in [../src/features/audit/audit.model.ts](../src/features/audit/audit.model.ts).

### Not included in current scope
- Encryption at rest for database volumes: **Not included in current scope**.
- Encrypted backup lifecycle management: **Not included in current scope**.
- TLS-enforced DB client connections policy documentation in repo: **Not included in current scope**.

## 6) Security Logging, Monitoring, and Audit Trail
- **What audit logs capture:** Auth success/failure, logout, OAuth outcomes, MFA events, CSRF failures, rate-limit hits, access-denied events, and selected platform actions.
- **Traceability fields:** `eventId`, `timestamp`, actor/target metadata, source context, request path/method, `requestId`, and `correlationId`.
- **Sensitive-data handling:** Audit metadata sanitization removes sensitive keys and masks email/phone values in [../src/features/audit/audit.service.ts](../src/features/audit/audit.service.ts).
- **How to query logs (high-level):**
  - `GET /api/audit?page=1&limit=20`
  - `GET /api/audit?eventType=<EVENT>&outcome=<OUTCOME>`
  - `GET /api/audit/:eventId`
- **Detailed verification steps:** [SECURITY_CHECKLIST_TESTS.md](SECURITY_CHECKLIST_TESTS.md).

## 7) Security Headers & Transport Security
- **Helmet/CSP/HSTS:** Configured in [../src/app.ts](../src/app.ts); HSTS is enabled in production and disabled outside production.
- **CORS allowlist approach:** Allowed origins are loaded from `CORS_ORIGINS`; requests are checked against allowlist when configured in [../src/app.ts](../src/app.ts).
- **Request limits:** JSON body size is limited (`express.json({ limit: "1mb" })`) in [../src/app.ts](../src/app.ts).
- **Additional middleware hardening:** `hpp` and Mongo key sanitization are enabled globally in [../src/app.ts](../src/app.ts).

## 8) Vulnerability Handling & Maintenance
- **Dependency updates:** Keep `pnpm` dependencies current and re-run security regression checks after updates.
- **Secret rotation guidance:** Rotate JWT/CSRF/SMTP/Google credentials through environment configuration and redeploy.
- **Incident response mini-checklist:**
  - Identify affected endpoint/user scope.
  - Review audit events around incident window.
  - Revoke active sessions (token blocklist path).
  - Rotate impacted secrets.
  - Patch and re-verify using checklist tests.
- **Operational references:**
  - [../../../docs/DEPLOYMENT.md](../../../docs/DEPLOYMENT.md)
  - [../../../docs/MAINTENANCE.md](../../../docs/MAINTENANCE.md)
  - [../../../docs/TROUBLESHOOTING.md](../../../docs/TROUBLESHOOTING.md)

## 9) Verification Guide (One-Page Summary)
- **Rate limit test (auth) → expected `429`**
  - Endpoint(s): `POST /api/auth/login` (or other login route with limiter)
  - Tool: Postman
- **Generic login error → expected `401` with same invalid-credentials pattern**
  - Endpoint(s): `POST /api/auth/community/login`, `POST /api/auth/lgu/login`
  - Tool: Postman
- **Password policy → expected `400`**
  - Endpoint(s): `POST /api/auth/community/register` and/or password reset/set-password routes
  - Tool: Postman / Web
- **NoSQL injection attempt → expected `400`/`401`**
  - Endpoint(s): auth or protected routes with malformed payload/query keys
  - Tool: Postman
- **Logout invalidates token → expected `401` after logout**
  - Endpoint(s): `POST /api/auth/logout` then `GET /api/auth/me` using same token
  - Tool: Postman / Web
- **CSRF test → expected `403` without token, success with token for browser-origin requests**
  - Endpoint(s): `GET /api/security/csrf` then unsafe `/api/*` route with/without `x-csrf-token`
  - Tool: Web / Postman (with browser-like `Origin`)
- **Audit log entry created → show query result**
  - Endpoint(s): `GET /api/audit?eventType=...`, `GET /api/audit/:eventId`
  - Tool: Postman

Full command scripts are in [SECURITY_CHECKLIST_TESTS.md](SECURITY_CHECKLIST_TESTS.md).

## 10) Security Artifacts Index
- [SECURITY_CHECKLIST_MAP.md](SECURITY_CHECKLIST_MAP.md)
- [SECURITY_CHECKLIST_TESTS.md](SECURITY_CHECKLIST_TESTS.md)
- [../../../docs/API.md](../../../docs/API.md)
- [../../../docs/DEPLOYMENT.md](../../../docs/DEPLOYMENT.md)
- [../../../docs/MAINTENANCE.md](../../../docs/MAINTENANCE.md)
- [../../../docs/TROUBLESHOOTING.md](../../../docs/TROUBLESHOOTING.md)
- [security_documentation.md](security_documentation.md)
