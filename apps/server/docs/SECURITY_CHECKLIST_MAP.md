# SECURITY_CHECKLIST_MAP

- [Implemented] Rate limiting for login/auth-sensitive routes
  - Files: `apps/server/src/middlewares/rateLimit.ts`, `apps/server/src/features/auth/auth.routes.ts`, `apps/server/src/features/auth/auth.community.routes.ts`, `apps/server/src/features/auth/auth.lgu.routes.ts`, `apps/server/src/features/auth/auth.admin.routes.ts`
  - Test route(s): `POST /api/auth/login`, `POST /api/auth/google`, `POST /api/auth/community/login`, `POST /api/auth/community/register`, `POST /api/auth/lgu/login`, `POST /api/auth/admin/mfa/verify`

- [Implemented] Generic login errors (non-enumerable) on community/LGU/admin password phase
  - Files: `apps/server/src/features/auth/auth.community.routes.ts`, `apps/server/src/features/auth/auth.lgu.routes.ts`, `apps/server/src/features/auth/auth.controller.ts`
  - Test route(s): `POST /api/auth/community/login`, `POST /api/auth/lgu/login`, `POST /api/auth/login`, `POST /api/auth/google`

- [Implemented] Strong password policy in all password set flows
  - Files: `apps/server/src/features/auth/password.policy.ts`, `apps/server/src/features/auth/auth.schemas.ts`, `apps/server/src/features/auth/auth.community.routes.ts`, `apps/server/src/features/auth/routes/signupOtp.routes.ts`, `apps/server/src/features/auth/routes/passwordReset.routes.ts`, `apps/server/src/features/auth/auth.google.controller.ts`
  - Test route(s): `POST /api/auth/community/register`, `POST /api/auth/signup`, `POST /api/auth/password/reset`, `POST /api/auth/set-password`

- [Implemented] Logout invalidates JWT session server-side (JTI blocklist)
  - Files: `apps/server/src/utils/jwt.ts`, `apps/server/src/features/auth/TokenBlocklist.model.ts`, `apps/server/src/middlewares/requireAuth.ts`, `apps/server/src/features/auth/auth.controller.ts`, `apps/server/src/features/auth/auth.routes.ts`
  - Test route(s): `POST /api/auth/logout`, `GET /api/auth/me`

- [Implemented] Global NoSQL injection sanitization middleware
  - Files: `apps/server/src/app.ts`
  - Test route(s): `POST /api/auth/community/login`, `POST /api/auth/lgu/login`

- [Implemented] CSRF protection for browser-origin unsafe requests (double-submit cookie)
  - What it is:
    - Browser requests using unsafe methods (`POST`, `PATCH`, `PUT`, `DELETE`) must provide a valid CSRF header token that matches server validation state.
    - Non-browser clients (mobile/server-to-server without Origin/Referer) are intentionally skipped and continue using Bearer token auth.
  - Enforcement files:
    - `apps/server/src/middlewares/csrf.ts`
    - `apps/server/src/features/security/security.routes.ts`
    - `apps/server/src/app.ts`
    - `apps/web/src/lib/api.ts` (client token bootstrap + header attach)
  - Test route(s):
    - `GET /api/security/csrf`
    - Any unsafe browser endpoint, e.g. `POST /api/auth/logout`, `POST /api/dispatches`

- [Implemented] Stronger DB hardening (strict schemas, strict query mode, index and input hygiene)
  - What it is:
    - Global Mongo query hardening via strict query mode.
    - Schema-level strictness (`strict: "throw"`) on key models to reject unexpected fields.
    - Controlled indexing/TTL for sensitive collections and OTP/session cleanup.
    - Global key sanitization for request payload/query/params before DB usage.
  - Hardening files:
    - `apps/server/src/config/db.ts` (Mongoose `strictQuery`, connection guards, prod `autoIndex` policy)
    - `apps/server/src/app.ts` (NoSQL sanitize middleware and param sanitization)
    - `apps/server/src/features/users/user.model.ts`
    - `apps/server/src/features/dispatches/dispatch.model.ts`
    - `apps/server/src/features/hazardZones/hazardZone.model.ts`
    - `apps/server/src/features/volunteerApplications/volunteerApplication.model.ts`
    - `apps/server/src/features/auth/TokenBlocklist.model.ts`
    - `apps/server/src/features/auth/MfaChallenge.ts`
    - `apps/server/src/features/auth/models/EmailVerificationRequest.model.ts`
    - `apps/server/src/features/auth/models/PasswordResetRequest.model.ts`
  - Test route(s):
    - Injection-shaped auth payload checks on login routes
    - OTP/login/logout flows (for TTL/indexed collections)

- [Implemented] XSS hardening headers (Helmet + CSP + production HSTS)
  - Files: `apps/server/src/app.ts`
  - Test route(s): `GET /health` (inspect response headers)

- [Implemented] Dispatch proof validation (type, size, magic bytes)
  - Files: `apps/server/src/features/dispatches/dispatch.validation.ts`, `apps/server/src/features/dispatches/dispatch.service.ts`, `apps/server/src/features/dispatches/dispatch.controller.ts`
  - Test route(s): `POST /api/dispatches/:id/proof`, `GET /uploads/dispatch-proofs/:filename`

- [Implemented] RBAC tightening: hazard-zones write operations
  - Files: `apps/server/src/features/hazardZones/hazardZone.routes.ts`
  - Test route(s): `POST /api/hazard-zones`, `DELETE /api/hazard-zones/:id`, `PATCH /api/hazard-zones/:id/status`

- [Implemented] RBAC tightening: volunteer applications
  - Files: `apps/server/src/features/volunteerApplications/volunteerApplication.routes.ts`
  - Test route(s): `POST /api/volunteer-applications`, `GET /api/volunteer-applications/me/latest`, `GET /api/volunteer-applications`, `GET /api/volunteer-applications/:id`, `POST /api/volunteer-applications/:id/review`

- [Implemented] Application audit logging
  - Files: `apps/server/src/features/audit/audit.model.ts`, `apps/server/src/features/audit/audit.service.ts`, `apps/server/src/features/auth/auth.community.routes.ts`, `apps/server/src/features/auth/auth.lgu.routes.ts`, `apps/server/src/features/auth/auth.controller.ts`, `apps/server/src/features/dispatches/dispatch.controller.ts`, `apps/server/src/features/hazardZones/hazardZone.controller.ts`, `apps/server/src/features/volunteerApplications/volunteerApplication.controller.ts`
  - Test route(s): Auth login/logout, dispatch proof/verify, hazard create/delete/status, volunteer submit/review; then inspect `audit_logs` collection.

- [Implemented] Web and Mobile call server logout endpoint before local cleanup
  - Files: `apps/web/src/features/auth/constants/auth.constants.ts`, `apps/web/src/features/auth/services/lguAuth.service.ts`, `apps/web/src/components/Header.tsx`, `apps/mobile/features/auth/auth.session.ts`
  - Test route(s): Trigger logout from web/mobile UI and verify `POST /api/auth/logout` then token rejection on `GET /api/auth/me`

