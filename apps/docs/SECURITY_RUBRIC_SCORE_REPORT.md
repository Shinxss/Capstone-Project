# SECURITY RUBRIC SCORE REPORT

## A) Header
- Course Code: ITE 370 - IAS 2
- Group #: 
- Course Description: IAS 2
- Date: 2026-02-18 (Asia/Manila)

## B) Executive Summary
Lifeline shows **implemented** security controls in core backend enforcement (authentication, RBAC, input validation, CSRF, NoSQL sanitization, and audit logging), with supporting web/mobile client behavior for token handling and logout invalidation. The strongest evidence is in server-side middleware and auth flows, not only in documentation.

Overall readiness is **Partially Implemented (implementation-led, with some docs-only and non-verifiable controls)**. Main risk concentration is in formal threat modeling artifacts (DFD/STRIDE/OWASP/risk scoring), database transport/encryption guarantees, and operational controls that are documented but not verifiable as configured in code/repo (e.g., backups/TLS posture).

**Top 5 strongest controls**
1. Strong auth controls: bcrypt hashing + JWT validation + token blocklist logout invalidation + rate limiting + admin MFA.
2. Broad server-side input validation using Zod and centralized validation middleware.
3. CSRF double-submit cookie implementation for browser-origin unsafe methods, integrated with web client token bootstrap/retry.
4. NoSQL injection hardening via global key sanitization and strict schema/query settings.
5. Application-level audit logging for security-relevant actions with metadata redaction.

**Top 5 highest-risk gaps**
1. No formal threat modeling artifacts (DFD/STRIDE/OWASP mapping/risk scoring) found in app docs.
2. DB connection TLS requirements are not explicitly enforced in code (depends on URI/environment).
3. Encryption-at-rest is partial (dispatch proof files encrypted; DB-at-rest controls not verifiable in repo).
4. Backup security is documented as guidance, but no implementation evidence/configuration in repo.
5. Security-sensitive fallback defaults exist for secrets in code paths (dev fallback secrets).

## C) Group Rubric Scoring (TOTAL: 60%)

Scoring rule used per rubric: `points = (level_score / 5) * category_max_points`

| Category | Weight | Level Score (2–5) | Max Points | Computed Points | Justification |
|---|---:|---:|---:|---:|---|
| Authentication | 6 | 4 (Good) | 30 | 24.00 | Strong hashing, token validation, logout invalidation, rate limiting, and admin MFA are implemented; however, token model is single access token (`7d`) with no refresh/rotation and no full secure-session cookie model. |
| Input Validation | 5 | 4 (Good) | 25 | 20.00 | Widespread Zod validation, CSRF, NoSQL sanitization, and upload type/size/magic-byte validation are present; SQL-specific criterion is stack-inapplicable/not verifiable and context-aware output encoding is not explicitly documented beyond framework defaults + CSP. |
| Database Security | 4 | 3 (Fair) | 20 | 12.00 | RBAC and audit logging are strong; encryption-at-rest is partial and DB TLS/backups are not verifiable as enforced from repository code/config. |
| Threat Modeling | 3 | 2 (Needs Improvement) | 15 | 6.00 | No verifiable DFD/STRIDE/OWASP/risk scoring/mitigation-tracking artifacts found in app documentation. |
| Documentation | 2 | 4 (Good) | 10 | 8.00 | Server docs are comprehensive (security, API, deployment, troubleshooting, maintenance); web/mobile docs are present but less comprehensive for security operations depth. |

**Subtotal:** 70.00 / 100

**Equivalent Group Component (60% scale):** 42.00 / 60

## D) Detailed Checklist + Evidence Map (Required)

### Category 1: Authentication

| Checklist Item | Status | Evidence (file + snippet + notes) |
|---|---|---|
| Strong password hashing (bcrypt/Argon2) | ✅ Implemented | [apps/server/src/features/auth/auth.community.routes.ts](apps/server/src/features/auth/auth.community.routes.ts#L31-L43): `const passwordHash = await bcrypt.hash(password, 10);`; [apps/server/src/features/auth/routes/passwordReset.routes.ts](apps/server/src/features/auth/routes/passwordReset.routes.ts#L186-L188): `user.passwordHash = await bcrypt.hash(..., 12);`; [apps/server/src/features/auth/auth.service.ts](apps/server/src/features/auth/auth.service.ts#L12-L14): `bcrypt.compare(...)`. |
| Secure sessions with expiry | 🟡 Partial | [apps/server/src/utils/jwt.ts](apps/server/src/utils/jwt.ts#L7-L23): JWT includes `expiresIn` and `jti`; [apps/server/src/middlewares/requireAuth.ts](apps/server/src/middlewares/requireAuth.ts#L13-L26): verified token + blocklist check. Uses bearer tokens; no refresh-token rotation model found. |
| Generic login errors | ✅ Implemented | [apps/server/src/features/auth/auth.community.routes.ts](apps/server/src/features/auth/auth.community.routes.ts#L11-L15) constant `INVALID_CREDENTIALS`; [apps/server/src/features/auth/auth.community.routes.ts](apps/server/src/features/auth/auth.community.routes.ts#L71-L80) returns same generic error; [apps/server/src/features/auth/auth.lgu.routes.ts](apps/server/src/features/auth/auth.lgu.routes.ts#L11-L16) same pattern. |
| Rate limiting for logins | ✅ Implemented | [apps/server/src/middlewares/rateLimit.ts](apps/server/src/middlewares/rateLimit.ts#L9-L19): limiter windows/max; [apps/server/src/features/auth/auth.routes.ts](apps/server/src/features/auth/auth.routes.ts#L18-L27): `loginLimiter`, `otpLimiter`, `passwordLimiter` applied to auth routes. |
| MFA available or enforced | ✅ Implemented | [apps/server/src/features/auth/auth.lgu.routes.ts](apps/server/src/features/auth/auth.lgu.routes.ts#L38-L73): admin login requires OTP challenge; [apps/server/src/features/auth/auth.admin.routes.ts](apps/server/src/features/auth/auth.admin.routes.ts#L7-L7): `/mfa/verify`; [apps/server/src/utils/mfa.ts](apps/server/src/utils/mfa.ts#L17-L53): one-time challenge verify/delete. |
| Validated tokens (JWT) | ✅ Implemented | [apps/server/src/utils/jwt.ts](apps/server/src/utils/jwt.ts#L25-L37): `jwt.verify` with payload checks (`jti`,`exp`); [apps/server/src/middlewares/requireAuth.ts](apps/server/src/middlewares/requireAuth.ts#L13-L26) rejects invalid/revoked tokens. |
| Strong password policy | ✅ Implemented | [apps/server/src/features/auth/password.policy.ts](apps/server/src/features/auth/password.policy.ts#L3-L13): min length + alphanumeric regex; [apps/server/src/features/auth/auth.schemas.ts](apps/server/src/features/auth/auth.schemas.ts#L5-L10) and [apps/server/src/features/auth/routes/passwordReset.routes.ts](apps/server/src/features/auth/routes/passwordReset.routes.ts#L33-L39) enforce via Zod. |
| Logout invalidates session | ✅ Implemented | [apps/server/src/features/auth/auth.controller.ts](apps/server/src/features/auth/auth.controller.ts#L85-L117): inserts JWT `jti` into blocklist on logout; [apps/server/src/features/auth/TokenBlocklist.model.ts](apps/server/src/features/auth/TokenBlocklist.model.ts#L21-L24): TTL index; [apps/server/src/middlewares/requireAuth.ts](apps/server/src/middlewares/requireAuth.ts#L16-L22): revoked tokens denied. |
| OAuth/SSO or advanced auth (bonus) | ✅ Implemented | [apps/server/src/features/auth/auth.google.controller.ts](apps/server/src/features/auth/auth.google.controller.ts#L39-L58) verifies Google ID token audience/payload; login/link flows implemented. |

### Category 2: Input Validation

| Checklist Item | Status | Evidence (file + snippet + notes) |
|---|---|---|
| All inputs validated server-side | 🟡 Partial | [apps/server/src/middlewares/validate.ts](apps/server/src/middlewares/validate.ts#L6-L27): reusable Zod validator; route-level usage in [apps/server/src/features/auth/auth.community.routes.ts](apps/server/src/features/auth/auth.community.routes.ts#L15-L15) and [apps/server/src/features/dispatches/dispatch.routes.ts](apps/server/src/features/dispatches/dispatch.routes.ts#L24-L39). Many routes are validated; not every endpoint was exhaustively proven. |
| Parameterized SQL queries | ⚪ Not verifiable | Stack is MongoDB/Mongoose, not SQL. No SQL query layer observed; criterion is non-applicable as implemented. Evidence: [apps/server/src/config/db.ts](apps/server/src/config/db.ts#L9-L24), [apps/server/src/features/dispatches/dispatch.service.ts](apps/server/src/features/dispatches/dispatch.service.ts#L22-L31). |
| XSS protection (context-aware escaping) | 🟡 Partial | [apps/server/src/app.ts](apps/server/src/app.ts#L55-L70): Helmet CSP enabled; [apps/server/src/app.ts](apps/server/src/app.ts#L17-L17): `x-powered-by` disabled; no `dangerouslySetInnerHTML` found in web scan (tool search). No dedicated output sanitization library found for rich HTML content. |
| File upload validation (type + size) | ✅ Implemented | [apps/server/src/features/dispatches/dispatch.validation.ts](apps/server/src/features/dispatches/dispatch.validation.ts#L21-L27): base64 size cap + allowed mime enum; [apps/server/src/features/dispatches/dispatch.service.ts](apps/server/src/features/dispatches/dispatch.service.ts#L354-L405): mime/data-url/base64 checks + magic-byte detection + max bytes. |
| API schema validation | ✅ Implemented | Zod schemas + middleware: [apps/server/src/middlewares/validate.ts](apps/server/src/middlewares/validate.ts#L6-L27), [apps/server/src/features/emergency/emergency.routes.ts](apps/server/src/features/emergency/emergency.routes.ts#L15-L18), [apps/server/src/features/auth/auth.schemas.ts](apps/server/src/features/auth/auth.schemas.ts#L4-L22). |
| NoSQL injection protection | ✅ Implemented | [apps/server/src/app.ts](apps/server/src/app.ts#L74-L90): `@exortek/express-mongo-sanitize` + custom key sanitizer; [apps/server/src/app.ts](apps/server/src/app.ts#L93-L97): params sanitized; [apps/server/src/config/db.ts](apps/server/src/config/db.ts#L7-L7): `strictQuery`. |
| CSRF tokens enabled | ✅ Implemented | [apps/server/src/middlewares/csrf.ts](apps/server/src/middlewares/csrf.ts#L45-L67): double-submit CSRF with sameSite cookie + token header; [apps/server/src/features/security/security.routes.ts](apps/server/src/features/security/security.routes.ts#L11-L14): CSRF token endpoint; [apps/web/src/lib/api.ts](apps/web/src/lib/api.ts#L24-L73): fetch/store/attach `x-csrf-token`. |

### Category 3: Database Security

| Checklist Item | Status | Evidence (file + snippet + notes) |
|---|---|---|
| Secure credential storage (.env/vault) | ✅ Implemented | [apps/server/src/server.ts](apps/server/src/server.ts#L6-L10): reads `MONGODB_URI` from env and fails if missing; [apps/server/.env.example](apps/server/.env.example#L1-L18): template only (no real secrets). |
| Role-based access control | ✅ Implemented | [apps/server/src/middlewares/requireRole.ts](apps/server/src/middlewares/requireRole.ts#L7-L20); route enforcement in [apps/server/src/features/hazardZones/hazardZone.routes.ts](apps/server/src/features/hazardZones/hazardZone.routes.ts#L17-L23) and [apps/server/src/features/volunteerApplications/volunteerApplication.routes.ts](apps/server/src/features/volunteerApplications/volunteerApplication.routes.ts#L15-L27). |
| Database encryption at rest | 🟡 Partial | App-level encryption-at-rest exists for dispatch proof files, not full DB data: [apps/server/src/utils/aesGcm.ts](apps/server/src/utils/aesGcm.ts#L4-L22), [apps/server/src/features/dispatches/dispatch.service.ts](apps/server/src/features/dispatches/dispatch.service.ts#L180-L183). Full MongoDB TDE/at-rest encryption configuration not verifiable in repo. |
| Encrypted backups | ⚪ Not verifiable | Backup guidance exists in docs only: [apps/server/docs/DEPLOYMENT.md](apps/server/docs/DEPLOYMENT.md#L43-L45) (`Enable backups...`). No backup job/policy config found in repo. |
| Audit logging enabled | ✅ Implemented | [apps/server/src/features/audit/audit.model.ts](apps/server/src/features/audit/audit.model.ts#L13-L30) defines audit collection; [apps/server/src/features/audit/audit.service.ts](apps/server/src/features/audit/audit.service.ts#L63-L79) writes logs; auth routes call audit logging (e.g., [apps/server/src/features/auth/auth.community.routes.ts](apps/server/src/features/auth/auth.community.routes.ts#L81-L92)). |
| TLS database connections | ⚪ Not verifiable | [apps/server/src/config/db.ts](apps/server/src/config/db.ts#L9-L24) does not explicitly set `tls/ssl` options; TLS may be implied by connection string but not enforced in code. |
| Database hardening | ✅ Implemented | [apps/server/src/config/db.ts](apps/server/src/config/db.ts#L7-L24): strict query + production index policy; [apps/server/src/features/users/user.model.ts](apps/server/src/features/users/user.model.ts#L70-L76): `strict: "throw"`; [apps/server/src/app.ts](apps/server/src/app.ts#L74-L97): key sanitization. |

### Category 4: Threat Modeling

| Checklist Item | Status | Evidence (file + snippet + notes) |
|---|---|---|
| Data Flow Diagram created | ❌ Missing | No DFD artifact found under `apps/` by filename search command (`*DFD*.md`) and content search (`DFD`). |
| STRIDE threats identified | ❌ Missing | No STRIDE artifact found under `apps/` by filename/content search. |
| OWASP Top 10 mapped | ❌ Missing | No OWASP mapping document found under `apps/`; only control implementation docs exist. |
| Mitigation plan with priorities | 🟡 Partial | Operational mitigations exist in checklists/tests docs: [apps/server/docs/SECURITY_CHECKLIST_MAP.md](apps/server/docs/SECURITY_CHECKLIST_MAP.md#L1-L73), [apps/server/docs/SECURITY_CHECKLIST_TESTS.md](apps/server/docs/SECURITY_CHECKLIST_TESTS.md#L1-L140). Not a formal threat-model-driven prioritized risk register. |
| Risk assessment done | ❌ Missing | No qualitative/quantitative risk scoring matrix found in app docs. |
| Model updated regularly | ⚪ Not verifiable | No threat model artifact with revision cadence/changelog found in app docs. |
| Well-documented | 🟡 Partial | Security implementation docs are detailed (server docs), but formal threat modeling documentation is absent. |

### Category 5: Documentation

| Checklist Item | Status | Evidence (file + snippet + notes) |
|---|---|---|
| Complete README | 🟡 Partial | Strong README coverage in [apps/server/README.md](apps/server/README.md#L1-L128) and root [README.md](README.md#L1-L140), plus [apps/web/README.md](apps/web/README.md#L1-L52) and [apps/mobile/README.md](apps/mobile/README.md#L1-L44). Completeness varies by app. |
| Security documentation | ✅ Implemented | [apps/server/docs/SECURITY_CHECKLIST_MAP.md](apps/server/docs/SECURITY_CHECKLIST_MAP.md#L1-L73) and [apps/server/docs/SECURITY_CHECKLIST_TESTS.md](apps/server/docs/SECURITY_CHECKLIST_TESTS.md#L1-L140). |
| API documentation | ✅ Implemented | [apps/server/docs/API.md](apps/server/docs/API.md#L1-L187) endpoint groups, auth headers, CSRF flow, examples. |
| Deployment guide | ✅ Implemented | [apps/server/docs/DEPLOYMENT.md](apps/server/docs/DEPLOYMENT.md#L1-L76) with env, security, CORS, CSRF production notes. |
| Troubleshooting section | ✅ Implemented | [apps/server/docs/TROUBLESHOOTING.md](apps/server/docs/TROUBLESHOOTING.md#L1-L85) includes DB/CORS/CSRF/JWT/SMTP issues and fixes. |
| Maintenance notes | ✅ Implemented | [apps/server/docs/MAINTENANCE.md](apps/server/docs/MAINTENANCE.md#L1-L66) includes rotation/update cadence and incident checklist. |
| Organized & accessible docs | ✅ Implemented | [apps/server/docs/README.md](apps/server/docs/README.md#L1-L12) provides docs index and navigation. |

## E) Faculty Evaluator Checkpoint Form Mapping (Required)

### Category 1: Authentication

| Criteria | Selected Option | Evidence Note |
|---|---|---|
| Password Storage | **bcrypt/Argon2** | bcrypt hash/compare in [apps/server/src/features/auth/auth.community.routes.ts](apps/server/src/features/auth/auth.community.routes.ts#L31-L43), [apps/server/src/features/auth/auth.service.ts](apps/server/src/features/auth/auth.service.ts#L12-L14). |
| Session Management | **Expiry set** | JWT expiry configured in [apps/server/src/utils/jwt.ts](apps/server/src/utils/jwt.ts#L7-L23). |
| Error Handling | **Generic** | Uniform `Invalid credentials` responses in [apps/server/src/features/auth/auth.community.routes.ts](apps/server/src/features/auth/auth.community.routes.ts#L71-L80) and [apps/server/src/features/auth/auth.lgu.routes.ts](apps/server/src/features/auth/auth.lgu.routes.ts#L27-L31). |
| Brute Force Protection | **Rate limit** | `express-rate-limit` and auth route application in [apps/server/src/middlewares/rateLimit.ts](apps/server/src/middlewares/rateLimit.ts#L9-L19), [apps/server/src/features/auth/auth.routes.ts](apps/server/src/features/auth/auth.routes.ts#L18-L27). |
| MFA / 2FA | **Mandatory (admin)** | Admin flow returns `mfaRequired` and requires `/admin/mfa/verify` in [apps/server/src/features/auth/auth.lgu.routes.ts](apps/server/src/features/auth/auth.lgu.routes.ts#L38-L73), [apps/server/src/features/auth/auth.admin.routes.ts](apps/server/src/features/auth/auth.admin.routes.ts#L7-L7). |
| Token Security | **JWT validated** | Verify + payload checks + blocklist check in [apps/server/src/utils/jwt.ts](apps/server/src/utils/jwt.ts#L25-L37), [apps/server/src/middlewares/requireAuth.ts](apps/server/src/middlewares/requireAuth.ts#L13-L26). |
| Password Policy | **Length + complexity** | Policy regex/min length in [apps/server/src/features/auth/password.policy.ts](apps/server/src/features/auth/password.policy.ts#L3-L13). |
| Logout / Inactivity | **Invalidate** | Logout blocklist insertion in [apps/server/src/features/auth/auth.controller.ts](apps/server/src/features/auth/auth.controller.ts#L85-L117). |
| Extra Credit | **OAuth/SSO** | Google ID token verification + login/link flows in [apps/server/src/features/auth/auth.google.controller.ts](apps/server/src/features/auth/auth.google.controller.ts#L39-L58). |

### Category 2: Input Validation

| Criteria | Selected Option | Evidence Note |
|---|---|---|
| Server Validation | **All** | Centralized validation middleware + route usage in [apps/server/src/middlewares/validate.ts](apps/server/src/middlewares/validate.ts#L6-L27), [apps/server/src/features/emergency/emergency.routes.ts](apps/server/src/features/emergency/emergency.routes.ts#L15-L18). |
| SQL Injection | **ORM** | MongoDB/Mongoose ORM stack in [apps/server/src/config/db.ts](apps/server/src/config/db.ts#L9-L24); no raw SQL query layer found. |
| XSS | **Context aware** | CSP via Helmet in [apps/server/src/app.ts](apps/server/src/app.ts#L55-L70) and no `dangerouslySetInnerHTML` evidence in web scan. |
| File Upload | **Type + size** | Zod proof schema + size + allowed mime in [apps/server/src/features/dispatches/dispatch.validation.ts](apps/server/src/features/dispatches/dispatch.validation.ts#L21-L27), magic-byte checks in [apps/server/src/features/dispatches/dispatch.service.ts](apps/server/src/features/dispatches/dispatch.service.ts#L354-L405). |
| API Validation | **Schema** | Zod schemas across auth/emergency/dispatch routes: [apps/server/src/features/auth/auth.schemas.ts](apps/server/src/features/auth/auth.schemas.ts#L4-L22), [apps/server/src/features/dispatches/dispatch.routes.ts](apps/server/src/features/dispatches/dispatch.routes.ts#L24-L39). |
| NoSQL Injection | **ORM + validation** | `mongoSanitize` + key sanitization + strict query in [apps/server/src/app.ts](apps/server/src/app.ts#L74-L97), [apps/server/src/config/db.ts](apps/server/src/config/db.ts#L7-L7). |
| CSRF | **SameSite + token** | Double-submit cookie and `x-csrf-token` validation in [apps/server/src/middlewares/csrf.ts](apps/server/src/middlewares/csrf.ts#L48-L67), web token attach in [apps/web/src/lib/api.ts](apps/web/src/lib/api.ts#L63-L73). |

### Category 3: Database Security

| Criteria | Selected Option | Evidence Note |
|---|---|---|
| Credential Storage | **Secure .env** | Env-based configuration in [apps/server/src/server.ts](apps/server/src/server.ts#L6-L10) and template in [apps/server/.env.example](apps/server/.env.example#L1-L18). |
| Access Control | **RBAC** | Role middleware + route gating in [apps/server/src/middlewares/requireRole.ts](apps/server/src/middlewares/requireRole.ts#L7-L20), [apps/server/src/features/hazardZones/hazardZone.routes.ts](apps/server/src/features/hazardZones/hazardZone.routes.ts#L17-L23). |
| Encryption at Rest | **Some** | Encrypted dispatch proofs via AES-GCM in [apps/server/src/utils/aesGcm.ts](apps/server/src/utils/aesGcm.ts#L22-L39), write path in [apps/server/src/features/dispatches/dispatch.service.ts](apps/server/src/features/dispatches/dispatch.service.ts#L180-L183). |
| Backup Security | **None** | No backup implementation/config found in code; only guidance in [apps/server/docs/DEPLOYMENT.md](apps/server/docs/DEPLOYMENT.md#L43-L45). |
| Audit Logging | **Full logs** | Audit model/service + action logs in [apps/server/src/features/audit/audit.model.ts](apps/server/src/features/audit/audit.model.ts#L13-L30), [apps/server/src/features/audit/audit.service.ts](apps/server/src/features/audit/audit.service.ts#L63-L79). |
| Connection Security | **Plain** | No explicit TLS/mTLS option in [apps/server/src/config/db.ts](apps/server/src/config/db.ts#L9-L24); TLS cannot be proven from repo-only evidence. |
| Hardening | **Hardened** | Strict query/schema/sanitization controls in [apps/server/src/config/db.ts](apps/server/src/config/db.ts#L7-L24), [apps/server/src/features/users/user.model.ts](apps/server/src/features/users/user.model.ts#L70-L76), [apps/server/src/app.ts](apps/server/src/app.ts#L74-L97). |

### Category 4: Threat Modeling

| Criteria | Selected Option | Evidence Note |
|---|---|---|
| DFD | **None** | No DFD artifact found in `apps/` filename/content searches. |
| STRIDE | **None** | No STRIDE artifact found in `apps/` filename/content searches. |
| OWASP | **None** | No OWASP Top 10 mapping artifact found in `apps/` docs. |
| Mitigation | **Basic** | Security checklist/test docs describe mitigations/tests but not formal threat-model linkage: [apps/server/docs/SECURITY_CHECKLIST_MAP.md](apps/server/docs/SECURITY_CHECKLIST_MAP.md#L1-L73). |
| Risk Assessment | **None** | No risk scoring matrix/register found. |
| Updates | **Static** | No revision cadence tied to a threat model artifact found. |
| Documentation | **Basic** | Security implementation docs exist, but not threat modeling documentation. |

### Category 5: Documentation

| Criteria | Selected Option | Evidence Note |
|---|---|---|
| README | **Full + security** | Server and root READMEs include security sections: [apps/server/README.md](apps/server/README.md#L97-L108), [README.md](README.md#L103-L126). |
| Security Docs | **Detailed** | Dedicated server security docs: [apps/server/docs/SECURITY_CHECKLIST_MAP.md](apps/server/docs/SECURITY_CHECKLIST_MAP.md#L1-L73), [apps/server/docs/SECURITY_CHECKLIST_TESTS.md](apps/server/docs/SECURITY_CHECKLIST_TESTS.md#L1-L140). |
| API Docs | **Full spec** | Feature-grouped API catalog in [apps/server/docs/API.md](apps/server/docs/API.md#L45-L187). |
| Deployment | **Secure** | Secure deployment guidance in [apps/server/docs/DEPLOYMENT.md](apps/server/docs/DEPLOYMENT.md#L5-L76). |
| Troubleshooting | **Full** | Detailed troubleshooting playbook in [apps/server/docs/TROUBLESHOOTING.md](apps/server/docs/TROUBLESHOOTING.md#L1-L85). |
| Maintenance | **Schedule** | Weekly/monthly/release maintenance cadence in [apps/server/docs/MAINTENANCE.md](apps/server/docs/MAINTENANCE.md#L24-L34). |
| Accessibility | **Searchable** | Docs index in [apps/server/docs/README.md](apps/server/docs/README.md#L1-L12). |

## F) Findings (Actionable)

### Critical
1. **No formal threat model artifacts**
   - Risk: Security design decisions are not systematically analyzed/tracked (DFD, STRIDE, OWASP mapping, risk scoring absent).
   - Where: No matching files under `apps/`; only implementation docs in [apps/server/docs/SECURITY_CHECKLIST_MAP.md](apps/server/docs/SECURITY_CHECKLIST_MAP.md#L1-L73).
   - Minimal recommended fix: Create versioned threat model package (`DFD`, `STRIDE table`, `OWASP mapping`, `risk register`, `mitigation owners/timeline`) and link from docs index.

### High
2. **DB transport security not explicitly enforced in code**
   - Risk: Misconfigured `MONGODB_URI` may permit weaker connection settings; TLS posture cannot be guaranteed from code.
   - Where: [apps/server/src/config/db.ts](apps/server/src/config/db.ts#L9-L24).
   - Minimal recommended fix: Enforce TLS options in DB connection config and add startup assertion for secure URI/profile in production.

3. **Encryption-at-rest is partial**
   - Risk: Only dispatch proof files are app-encrypted; broader DB records may rely solely on platform defaults with no in-repo guarantees.
   - Where: [apps/server/src/utils/aesGcm.ts](apps/server/src/utils/aesGcm.ts#L22-L39), [apps/server/src/features/dispatches/dispatch.service.ts](apps/server/src/features/dispatches/dispatch.service.ts#L180-L183).
   - Minimal recommended fix: Document and enforce DB-at-rest encryption requirements (cluster policy), and identify high-sensitivity fields for field-level encryption if required.

### Medium
4. **Backup security is docs-only**
   - Risk: Recovery readiness and backup encryption cannot be validated from repository controls.
   - Where: [apps/server/docs/DEPLOYMENT.md](apps/server/docs/DEPLOYMENT.md#L43-L45).
   - Minimal recommended fix: Add operational runbook with backup schedule, encryption settings, restore drill evidence, and ownership.

5. **Security fallback secrets in code paths (dev defaults)**
   - Risk: Accidental production misconfiguration could silently use weak fallback secrets.
   - Where: [apps/server/src/utils/jwt.ts](apps/server/src/utils/jwt.ts#L5-L7), [apps/server/src/middlewares/csrf.ts](apps/server/src/middlewares/csrf.ts#L6-L6), [apps/server/src/utils/aesGcm.ts](apps/server/src/utils/aesGcm.ts#L16-L16).
   - Minimal recommended fix: Fail-fast in production when required secrets are missing; remove or gate insecure defaults behind explicit development-only checks.

### Low
6. **Session model lacks short-lived access + refresh rotation**
   - Risk: Longer-lived bearer tokens increase replay window if leaked.
   - Where: [apps/server/src/utils/jwt.ts](apps/server/src/utils/jwt.ts#L7-L23).
   - Minimal recommended fix: Introduce short-lived access tokens and rotating refresh tokens with server-side revocation/audit.

7. **Cross-app documentation depth is uneven**
   - Risk: Operational/security onboarding consistency is lower for web/mobile compared with server docs.
   - Where: [apps/web/README.md](apps/web/README.md#L1-L52), [apps/mobile/README.md](apps/mobile/README.md#L1-L44).
   - Minimal recommended fix: Add dedicated web/mobile security, troubleshooting, deployment, and maintenance sub-docs, then link from a unified docs index.

## G) Verification Commands Appendix

| Command | Purpose | Observed Output Summary |
|---|---|---|
| `pnpm --dir apps/server typecheck` | Validate server TypeScript build correctness for inspected security controls. | Completed with no TypeScript errors (`tsc -p tsconfig.json --noEmit`). |
| `Get-ChildItem -Path apps/server/src -Recurse -Include *.ts \| Select-String -Pattern 'helmet\|csrf-csrf\|express-rate-limit\|@exortek/express-mongo-sanitize\|doubleCsrfProtection' \| Select-Object -First 50 \| Out-String` | Verify key security middleware usage in server source. | Returned matches in `app.ts`, `middlewares/csrf.ts`, `middlewares/rateLimit.ts` confirming Helmet, CSRF, rate-limit, and NoSQL sanitize integration. |
| `Get-ChildItem apps -Recurse -Include *.md \| Select-String -Pattern 'DFD','STRIDE','OWASP','threat model','risk assessment' \| Select-Object -First 20 \| Out-String` | Check for formal threat-model keywords across app docs. | Command produced no output (no matching artifacts in app docs). |
| `Get-ChildItem -Path apps -Recurse -Include *threat*.md,*STRIDE*.md,*OWASP*.md,*DFD*.md \| Select-Object FullName \| Out-String` | Check for threat-model documents by filename in app folders. | No app-specific threat-model files listed. |
| `file_search: **/*threat*.md`, `**/*STRIDE*.md`, `**/*OWASP*.md`, `**/*DFD*.md` | Secondary artifact discovery across workspace paths. | No files found (excluding external dependency docs). |

---

### Scoring Integrity Notes
- Scoring followed rubric definitions in [ITE370_Checkpoint2_Rubrics.md](ITE370_Checkpoint2_Rubrics.md#L1-L232) and [ITE370_Checkpoint2_Rubrics.txt](ITE370_Checkpoint2_Rubrics.txt#L1-L201).
- Controls marked **docs-only** were not counted as fully implemented.
- Controls not provable from code/docs/config were marked **Not verifiable** and scored conservatively.
