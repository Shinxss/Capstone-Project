# Lifeline Security Checklist (Rubric Evidence)

Base URL: `http://localhost:5000`

## Category 1: Authentication

### 1) Strong password hashing (bcrypt/Argon2)
- Status: ✅ Implemented
- Evidence:
  - `apps/server/src/features/auth/auth.community.routes.ts` (register hashes password with `bcrypt.hash`)
  - `apps/server/src/features/auth/routes/passwordReset.routes.ts` (reset flow re-hashes with bcrypt)
  - `apps/server/src/features/auth/auth.service.ts` (login compares hash with `bcrypt.compare`)
- How to test:
  - Postman:
    1. Register a community account with `POST /api/auth/community/register`.
    2. Login with `POST /api/auth/community/login` using the same password.
    3. Use a wrong password and confirm login fails (`401`).
- API used in testing:
  - `POST /api/auth/community/register`
  - `POST /api/auth/community/login`

### 2) Secure sessions with expiry
- Status: 🟡 Partial
- Evidence:
  - `apps/server/src/utils/jwt.ts` (JWT is signed with `expiresIn` and unique `jti`)
  - `apps/server/src/middlewares/requireAuth.ts` (token verification + blocklist check)
  - `apps/server/src/features/auth/TokenBlocklist.model.ts` (revoked token IDs are persisted with expiry)
- How to test:
  - Postman:
    1. Login via `POST /api/auth/community/login` and copy token.
    2. Call `GET /api/auth/me` with Bearer token (expect `200`).
    3. Call `POST /api/auth/logout`, then call `/api/auth/me` again (expect `401 Invalid token`).
  - Note: token has expiry but no refresh-token rotation flow.
- API used in testing:
  - `POST /api/auth/community/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`

### 3) Generic login errors
- Status: ✅ Implemented
- Evidence:
  - `apps/server/src/features/auth/auth.community.routes.ts` (`Invalid credentials` for failed community auth)
  - `apps/server/src/features/auth/auth.lgu.routes.ts` (`Invalid credentials` for failed LGU/Admin password phase)
  - `apps/server/src/features/auth/auth.google.controller.ts` (returns generic invalid-credential style behavior for invalid Google token)
- How to test:
  - Postman:
    1. Send wrong email and password to `POST /api/auth/community/login`.
    2. Send correct email with wrong password to same endpoint.
    3. Confirm same failure message/status for both invalid cases.
- API used in testing:
  - `POST /api/auth/community/login`
  - `POST /api/auth/lgu/login`

### 4) Rate limiting for logins
- Status: ✅ Implemented
- Evidence:
  - `apps/server/src/middlewares/rateLimit.ts` (auth limiters via `express-rate-limit`)
  - `apps/server/src/features/auth/auth.routes.ts` (applies `loginLimiter`, `otpLimiter`, `passwordLimiter`)
  - `apps/server/src/features/auth/auth.community.routes.ts` and `apps/server/src/features/auth/auth.lgu.routes.ts` (login routes use limiter)
- How to test:
  - Postman/REST client:
    1. Send repeated bad login attempts to `POST /api/auth/community/login` quickly.
    2. Verify response changes to `429` after limit is exceeded.
- API used in testing:
  - `POST /api/auth/community/login`
  - `POST /api/auth/lgu/login`

### 5) MFA available or enforced
- Status: ✅ Implemented
- Evidence:
  - `apps/server/src/features/auth/auth.lgu.routes.ts` (Admin login triggers OTP challenge)
  - `apps/server/src/features/auth/auth.admin.routes.ts` (`POST /mfa/verify` endpoint)
  - `apps/server/src/utils/mfa.ts` (creates/verifies OTP challenge with expiry)
- How to test:
  - Web (LGU/Admin portal) or Postman:
    1. Login as Admin via `POST /api/auth/lgu/login`.
    2. Confirm response includes `mfaRequired: true` and `challengeId`.
    3. Verify OTP through `POST /api/auth/admin/mfa/verify`.
- API used in testing:
  - `POST /api/auth/lgu/login`
  - `POST /api/auth/admin/mfa/verify`

### 6) Validated tokens (JWT)
- Status: ✅ Implemented
- Evidence:
  - `apps/server/src/utils/jwt.ts` (`jwt.verify`, requires `jti` and `exp`)
  - `apps/server/src/middlewares/requireAuth.ts` (rejects malformed/invalid/revoked tokens)
- How to test:
  - Postman:
    1. Call `GET /api/auth/me` without token (expect `401`).
    2. Call with malformed token (expect `401`).
    3. Call with valid token (expect `200`).
- API used in testing:
  - `GET /api/auth/me`

### 7) Strong password policy
- Status: ✅ Implemented
- Evidence:
  - `apps/server/src/features/auth/password.policy.ts` (min length + letter/number regex)
  - `apps/server/src/features/auth/auth.schemas.ts` (schema uses password policy)
  - `apps/server/src/features/auth/routes/passwordReset.routes.ts` and `apps/server/src/features/auth/routes/signupOtp.routes.ts` (enforced in auth flows)
- How to test:
  - Mobile or Postman:
    1. Submit weak password (e.g., `1234567`) to signup/reset endpoint.
    2. Confirm request fails with validation error (`400`).
- API used in testing:
  - `POST /api/auth/signup`
  - `POST /api/auth/password/reset`
  - `POST /api/auth/set-password`

### 8) Logout invalidates session
- Status: ✅ Implemented
- Evidence:
  - `apps/server/src/features/auth/auth.controller.ts` (logout writes `jti` to blocklist)
  - `apps/server/src/features/auth/TokenBlocklist.model.ts` (TTL blocklist model)
  - `apps/server/src/middlewares/requireAuth.ts` (blocked token denied)
  - `apps/mobile/features/auth/auth.session.ts` and `apps/web/src/features/auth/services/lguAuth.service.ts` (clients call server logout)
- How to test:
  - Web:
    1. Login and call a protected page.
    2. Click logout.
    3. Retry protected request; expect unauthorized.
  - Postman:
    1. `POST /api/auth/logout` with token.
    2. Reuse same token on `/api/auth/me`; expect `401`.
- API used in testing:
  - `POST /api/auth/logout`
  - `GET /api/auth/me`

### 9) OAuth/SSO or advanced auth
- Status: ✅ Implemented
- Evidence:
  - `apps/server/src/features/auth/auth.google.controller.ts` (Google ID token verification + login)
  - `apps/mobile/features/auth/services/authApi.ts` (mobile calls `/api/auth/google` and `/api/auth/link-google`)
- How to test:
  - Mobile:
    1. Authenticate using Google sign-in.
    2. Submit Google ID token to backend and verify access token is returned.
  - Postman:
    1. Send an invalid `idToken` to `/api/auth/google`; expect auth failure.
- API used in testing:
  - `POST /api/auth/google`
  - `POST /api/auth/link-google`

## Category 2: Input Validation

### 1) All inputs validated server-side
- Status: 🟡 Partial
- Evidence:
  - `apps/server/src/middlewares/validate.ts` (central Zod validation middleware)
  - `apps/server/src/features/auth/auth.schemas.ts`, `apps/server/src/features/dispatches/dispatch.validation.ts`, `apps/server/src/features/emergency/emergency.validation.ts` (route schemas)
  - Not every route has explicit schema middleware, so coverage is broad but not universal.
- How to test:
  - Postman:
    1. Send invalid payload shape to `POST /api/dispatches` and `POST /api/auth/community/login`.
    2. Confirm `400 Validation error`.
- API used in testing:
  - `POST /api/dispatches`
  - `POST /api/auth/community/login`

### 2) Parameterized SQL queries
- Status: N/A
- Evidence:
  - `apps/server/src/config/db.ts` (MongoDB/Mongoose connection)
  - Server uses MongoDB models/services; no SQL query layer is present.
- How to test:
  - Review architecture and data-access code paths for SQL usage.
- API used in testing:
  - N/A (MongoDB-only stack)

### 3) XSS protection (context-aware escaping)
- Status: 🟡 Partial
- Evidence:
  - `apps/server/src/app.ts` (Helmet + CSP + anti-header hardening)
  - `apps/server/src/features/audit/audit.service.ts` (sanitizes sensitive metadata fields)
  - No dedicated output-encoding library for rich user HTML rendering found.
- How to test:
  - Web:
    1. Submit text fields containing `<script>alert(1)</script>` where applicable.
    2. Open page that renders data and verify script does not execute.
  - Postman:
    1. Check headers on `GET /health` for CSP and related protections.
- API used in testing:
  - `GET /health`

### 4) File upload validation (type + size)
- Status: ✅ Implemented
- Evidence:
  - `apps/server/src/features/dispatches/dispatch.validation.ts` (proof payload max length, MIME allowlist)
  - `apps/server/src/features/dispatches/dispatch.service.ts` (base64 checks, max bytes, PNG/JPEG/HEIC magic-byte detection)
- How to test:
  - Mobile or Postman:
    1. Send invalid base64 to `POST /api/dispatches/:id/proof`.
    2. Send oversized payload and verify rejection.
    3. Send valid PNG/JPEG/HEIC payload and verify success.
- API used in testing:
  - `POST /api/dispatches/:id/proof`

### 5) API schema validation
- Status: ✅ Implemented
- Evidence:
  - `apps/server/src/middlewares/validate.ts` (schema middleware)
  - `apps/server/src/features/dispatches/dispatch.routes.ts` and `apps/server/src/features/emergency/emergency.routes.ts` (validate body/query/params)
- How to test:
  - Postman:
    1. Send invalid `status` query to dispatch list route.
    2. Send invalid emergency payload.
    3. Confirm `400` validation error.
- API used in testing:
  - `GET /api/dispatches`
  - `POST /api/emergencies/sos`

### 6) NoSQL injection protection
- Status: ✅ Implemented
- Evidence:
  - `apps/server/src/app.ts` (global `@exortek/express-mongo-sanitize` + key sanitization for `$` and `.`)
  - `apps/server/src/config/db.ts` (`mongoose.set("strictQuery", true)`)
- How to test:
  - Postman:
    1. Send login payload using operators (e.g., `{ "email": { "$ne": null } }`).
    2. Confirm request does not bypass authentication.
- API used in testing:
  - `POST /api/auth/community/login`

### 7) CSRF tokens enabled
- Status: ✅ Implemented
- Evidence:
  - `apps/server/src/middlewares/csrf.ts` (double-CSRF middleware)
  - `apps/server/src/features/security/security.routes.ts` (`GET /api/security/csrf`)
  - `apps/server/src/app.ts` (global CSRF protection applied)
  - `apps/web/src/lib/api.ts` (web client fetches CSRF token and sends `x-csrf-token`)
- How to test:
  - Web/Postman:
    1. Get token from `GET /api/security/csrf`.
    2. Send unsafe browser-style request without `x-csrf-token` and with Origin header; expect `403`.
    3. Repeat with valid token; expect success.
- API used in testing:
  - `GET /api/security/csrf`
  - `POST /api/auth/logout`

## Category 3: Database Security

### 1) Secure credential storage (.env/vault)
- Status: ✅ Implemented
- Evidence:
  - `apps/server/src/server.ts` (startup fails when `MONGODB_URI` is missing)
  - `apps/server/.env.example` (secrets are configured through environment variables, not hard-coded in config files)
- How to test:
  - Postman/ops check:
    1. Start server with missing `MONGODB_URI` and verify startup fails.
    2. Start with valid env variables and verify `/health` responds.
- API used in testing:
  - `GET /health`

### 2) Role-based access control
- Status: ✅ Implemented
- Evidence:
  - `apps/server/src/middlewares/requireRole.ts` (RBAC middleware)
  - `apps/server/src/features/hazardZones/hazardZone.routes.ts`, `apps/server/src/features/volunteerApplications/volunteerApplication.routes.ts`, `apps/server/src/features/users/user.routes.ts` (role-restricted endpoints)
- How to test:
  - Postman:
    1. Use COMMUNITY token on LGU-only route (expect `403`).
    2. Use LGU/ADMIN token on same route (expect success).
- API used in testing:
  - `POST /api/hazard-zones`
  - `GET /api/users/volunteers`
  - `POST /api/volunteer-applications/:id/review`

### 3) Database encryption at rest
- Status: ❌ Not included
- Evidence:
  - No MongoDB-at-rest encryption configuration is defined in repository deployment/config files.
- How to test:
  - Not included:
    - Current scope does not include DB-at-rest encryption controls in repo.
    - Future improvement: enforce encrypted storage at DB platform level (e.g., Atlas/managed disk encryption policy) and document it in deployment evidence.
- API used in testing:
  - N/A (infrastructure-level control not configured in codebase)

### 4) Encrypted backups
- Status: ❌ Not included
- Evidence:
  - `apps/docs/DEPLOYMENT.md` mentions enabling backups, but no implemented backup automation/policy is present in repo.
- How to test:
  - Not included:
    - Current scope does not include backup encryption implementation artifacts.
    - Future improvement: add backup runbook, encrypted backup policy, and restore drill evidence.
- API used in testing:
  - N/A (operations control not implemented)

### 5) Audit logging enabled
- Status: ✅ Implemented
- Evidence:
  - `apps/server/src/features/audit/audit.model.ts` and `apps/server/src/features/audit/audit.service.ts` (audit log schema and writer)
  - Auth/dispatch/hazard/volunteer controllers call audit logging in security-relevant actions.
- How to test:
  - Postman:
    1. Execute login/logout/dispatch/hazard review actions.
    2. Verify corresponding records are written to `audit_logs` in MongoDB.
- API used in testing:
  - `POST /api/auth/community/login`
  - `POST /api/auth/logout`
  - `PATCH /api/dispatches/:id/verify`
  - `POST /api/volunteer-applications/:id/review`

### 6) TLS database connections
- Status: ❌ Not included
- Evidence:
  - `apps/server/src/config/db.ts` does not explicitly enforce TLS connection options.
- How to test:
  - Not included:
    - Current repo does not enforce TLS DB connection settings in code.
    - Future improvement: enforce TLS options and fail startup when insecure DB URI/config is used in production.
- API used in testing:
  - N/A (transport policy not implemented)

### 7) Database hardening
- Status: ✅ Implemented
- Evidence:
  - `apps/server/src/config/db.ts` (`strictQuery`, production `autoIndex` control)
  - `apps/server/src/app.ts` (request key sanitization)
  - `apps/server/src/features/users/user.model.ts`, `apps/server/src/features/dispatches/dispatch.model.ts`, `apps/server/src/features/hazardZones/hazardZone.model.ts`, `apps/server/src/features/volunteerApplications/volunteerApplication.model.ts` (strict schemas)
- How to test:
  - Postman:
    1. Send payloads containing invalid extra fields/operators.
    2. Confirm validation/sanitization rejects or neutralizes malicious structures.
- API used in testing:
  - `POST /api/auth/community/login`
  - `POST /api/dispatches`

## Category 4: Threat Modeling

### 1) Data Flow Diagram created
- Status: ❌ Not included
- Evidence:
  - No DFD artifact was found in `apps/docs` or other project docs.
- How to test:
  - Documentation review:
    1. Search docs for DFD/data-flow artifact.
    2. Confirm absence.
  - Not included:
    - Future improvement: add `apps/docs/THREAT_MODEL_DFD.md` with trust boundaries and data stores.
- API used in testing:
  - N/A (documentation artifact check)

### 2) STRIDE threats identified
- Status: ❌ Not included
- Evidence:
  - No STRIDE threat matrix document found in project docs.
- How to test:
  - Documentation review:
    1. Search docs for STRIDE table by feature.
    2. Confirm absence.
  - Not included:
    - Future improvement: add STRIDE matrix and map to mitigations per endpoint group.
- API used in testing:
  - N/A (documentation artifact check)

### 3) OWASP Top 10 mapped
- Status: ❌ Not included
- Evidence:
  - No dedicated OWASP Top 10 mapping file found in `apps/docs`.
- How to test:
  - Documentation review:
    1. Verify whether each OWASP Top 10 item is mapped to controls.
    2. Confirm missing mapping document.
  - Not included:
    - Future improvement: add OWASP mapping table tied to code evidence paths.
- API used in testing:
  - N/A (documentation artifact check)

### 4) Mitigation plan with priorities
- Status: 🟡 Partial
- Evidence:
  - `apps/docs/SECURITY_CHECKLIST_MAP.md` and `apps/docs/SECURITY_RUBRIC_SCORE_REPORT.md` list controls and gaps.
  - No single threat-model mitigation plan with explicit owner/priority timeline.
- How to test:
  - Documentation review:
    1. Check docs for prioritized mitigation register.
    2. Confirm partial coverage only.
  - Future improvement: create a prioritized risk register with owner/date/status.
- API used in testing:
  - N/A (documentation artifact check)

### 5) Risk assessment done
- Status: ❌ Not included
- Evidence:
  - No formal risk assessment matrix/register document found.
- How to test:
  - Documentation review:
    1. Search for risk scoring table (impact/likelihood).
    2. Confirm missing artifact.
  - Not included:
    - Future improvement: add scored risk matrix with acceptance criteria.
- API used in testing:
  - N/A (documentation artifact check)

### 6) Model updated regularly
- Status: ❌ Not included
- Evidence:
  - No threat-model document with version history or update cadence found.
- How to test:
  - Documentation review:
    1. Look for changelog/versioned threat model history.
    2. Confirm not present.
  - Not included:
    - Future improvement: maintain dated revisions for threat model updates.
- API used in testing:
  - N/A (documentation artifact check)

### 7) Well-documented
- Status: 🟡 Partial
- Evidence:
  - Security implementation docs exist: `apps/docs/SECURITY_CHECKLIST_MAP.md`, `apps/docs/SECURITY_CHECKLIST_TESTS.md`.
  - Missing core threat-model artifacts (DFD/STRIDE/OWASP/risk register).
- How to test:
  - Documentation review:
    1. Verify doc index and security docs exist.
    2. Verify threat-model-specific docs are absent.
- API used in testing:
  - N/A (documentation artifact check)

## Category 5: Documentation

### 1) Complete README
- Status: ✅ Implemented
- Evidence:
  - `README.md` (root overview, security section)
  - `apps/server/README.md`, `apps/web/README.md`, `apps/mobile/README.md` (app-level readmes)
- How to test:
  - Documentation review:
    1. Open each README and verify setup + architecture + usage details are present.
- API used in testing:
  - N/A (documentation review)

### 2) Security documentation
- Status: ✅ Implemented
- Evidence:
  - `apps/docs/SECURITY_CHECKLIST_MAP.md`
  - `apps/docs/SECURITY_RUBRIC_SCORE_REPORT.md`
  - `apps/docs/SECURITY_CHECKLIST_TESTS.md`
- How to test:
  - Documentation review:
    1. Verify security controls and testing procedures are documented.
- API used in testing:
  - `GET /api/security/csrf` (referenced and used in security test flow)

### 3) API documentation
- Status: ✅ Implemented
- Evidence:
  - `apps/docs/API.md` (grouped endpoints, headers, request/response examples)
- How to test:
  - Postman:
    1. Validate documented routes respond as described.
- API used in testing:
  - `POST /api/auth/community/login`
  - `GET /api/hazard-zones`
  - `GET /api/users/volunteers`

### 4) Deployment guide
- Status: ✅ Implemented
- Evidence:
  - `apps/docs/DEPLOYMENT.md` (environment variables, production guidance, CSRF and CORS deployment notes)
- How to test:
  - Postman/ops smoke test:
    1. Deploy with documented env variables.
    2. Confirm `GET /health` and authenticated API checks pass.
- API used in testing:
  - `GET /health`
  - `GET /api/auth/me`

### 5) Troubleshooting section
- Status: ✅ Implemented
- Evidence:
  - `apps/docs/TROUBLESHOOTING.md` (DB, CORS, CSRF, JWT, SMTP troubleshooting steps)
- How to test:
  - Follow documented troubleshooting flow and verify affected endpoint behavior.
- API used in testing:
  - `GET /api/security/csrf`
  - `GET /api/auth/me`

### 6) Maintenance notes
- Status: ✅ Implemented
- Evidence:
  - `apps/docs/MAINTENANCE.md` (secret rotation, dependency update cadence, monitoring routine)
- How to test:
  - Ops/documentation review:
    1. Follow maintenance checklist and run periodic endpoint smoke tests.
- API used in testing:
  - `GET /health`

### 7) Organized & accessible docs
- Status: ✅ Implemented
- Evidence:
  - `apps/docs/README.md` (docs index links to security/API/deployment/maintenance/troubleshooting files)
- How to test:
  - Documentation review:
    1. Navigate docs from index and verify all target files are reachable.
- API used in testing:
  - N/A (documentation navigation)

## API Used for Testing (Summary)

### Auth
- `POST /api/auth/community/register` — tested via Mobile, Postman
- `POST /api/auth/community/login` — tested via Mobile, Postman
- `POST /api/auth/lgu/login` — tested via Web, Postman
- `POST /api/auth/admin/mfa/verify` — tested via Web, Postman
- `POST /api/auth/google` — tested via Mobile, Postman
- `POST /api/auth/link-google` — tested via Mobile
- `POST /api/auth/signup` — tested via Mobile, Postman
- `POST /api/auth/signup/verify-otp` — tested via Mobile, Postman
- `POST /api/auth/password/forgot` — tested via Mobile, Postman
- `POST /api/auth/password/verify-otp` — tested via Mobile, Postman
- `POST /api/auth/password/reset` — tested via Mobile, Postman
- `POST /api/auth/set-password` — tested via Mobile, Postman
- `GET /api/auth/me` — tested via Web, Mobile, Postman
- `POST /api/auth/logout` — tested via Web, Mobile, Postman

### Users
- `GET /api/users/volunteers` — tested via Web, Postman

### Dispatch
- `POST /api/dispatches` — tested via Web, Postman
- `GET /api/dispatches` — tested via Web, Postman
- `GET /api/dispatches/my/pending` — tested via Mobile
- `GET /api/dispatches/my/active` — tested via Mobile
- `GET /api/dispatches/my/current` — tested via Mobile
- `PATCH /api/dispatches/:id/respond` — tested via Mobile, Postman
- `POST /api/dispatches/:id/proof` — tested via Mobile, Postman
- `PATCH /api/dispatches/:id/complete` — tested via Mobile, Postman
- `PATCH /api/dispatches/:id/verify` — tested via Web, Postman
- `GET /uploads/dispatch-proofs/:filename` — tested via Web, Postman

### Hazard Zones
- `GET /api/hazard-zones` — tested via Web, Postman
- `POST /api/hazard-zones` — tested via Web, Postman
- `DELETE /api/hazard-zones/:id` — tested via Web, Postman
- `PATCH /api/hazard-zones/:id/status` — tested via Web, Postman

### Volunteers
- `POST /api/volunteer-applications` — tested via Mobile, Postman
- `GET /api/volunteer-applications/me/latest` — tested via Postman
- `GET /api/volunteer-applications` — tested via Web, Postman
- `GET /api/volunteer-applications/:id` — tested via Web, Postman
- `POST /api/volunteer-applications/:id/review` — tested via Web, Postman

### Security
- `GET /api/security/csrf` — tested via Web, Postman
- `GET /health` — tested via Postman (security headers and deployment smoke check)

### Docs
- N/A — documentation artifacts were verified by reviewing markdown files under `apps/docs` and project READMEs.
