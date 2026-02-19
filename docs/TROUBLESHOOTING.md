# Troubleshooting

## Security Documentation References

- Security architecture and controls: `apps/server/docs/security_documentation.md`
- Security control-to-code map: `apps/server/docs/SECURITY_CHECKLIST_MAP.md`
- Security test procedures: `apps/server/docs/SECURITY_CHECKLIST_TESTS.md`

Use the checklist tests as the source of truth for command-level verification steps.

## DB Connection Failures

### Symptoms
- Server exits on startup with missing/invalid MongoDB errors
- Timeouts when handling requests

### Checks
- Confirm `MONGODB_URI` is set and valid.
- Verify MongoDB Atlas/network allowlist or private network rules.
- Confirm database credentials and cluster status.

### Fix Steps
1. Validate environment variable value formatting.
2. Test connection string using MongoDB client tools.
3. Confirm DNS/network access from deployment environment.
4. Restart service after config correction.

## CORS Errors

### Symptoms
- Browser requests blocked with CORS policy messages
- Missing credentials/cookies on frontend calls

### Checks
- Ensure frontend origin is included in `CORS_ORIGINS`.
- Confirm web client sends `withCredentials: true` where required.

### Fix Steps
1. Add exact frontend origin(s) to `CORS_ORIGINS`.
2. Redeploy/restart backend.
3. Clear browser cache and retest.

## CSRF 403 Issues

### Symptoms
- `403` on unsafe browser requests
- Response includes `CSRF_INVALID` or `CSRF token validation failed`

### Checks
- Browser first calls `GET /api/security/csrf`.
- Unsafe request includes `x-csrf-token` header.
- CSRF cookie is being set and sent back.
- Frontend/base URL and origin match CORS/CSRF expectations.

### Fix Steps
1. Re-run CSRF bootstrap call and capture token.
2. Attach token in `x-csrf-token` for POST/PATCH/PUT/DELETE.
3. Ensure `withCredentials: true` on browser API client.
4. Verify HTTPS + cookie behavior in production.

## JWT Expired / Invalid Token Issues

### Symptoms
- `401` with invalid or expired token messages
- sudden logout behavior

### Checks
- Token age vs `JWT_ACCESS_EXPIRES_IN`.
- Whether token was invalidated on logout (blocklist).
- Correct `Authorization: Bearer <token>` formatting.

### Fix Steps
1. Re-authenticate to obtain a fresh token.
2. Confirm client stores and sends current token.
3. Check server clock skew if expiry appears incorrect.
4. Validate JWT secret consistency across instances.

## SMTP/OTP Failures

### Symptoms
- OTP emails not sent
- login or admin MFA fails at OTP phase

### Checks
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
- Provider security rules (TLS, app passwords, sender restrictions).

### Fix Steps
1. Test SMTP credentials independently.
2. Correct secure/non-secure port settings (`SMTP_SECURE`).
3. Verify sender identity and domain policy at provider.
4. Re-test OTP endpoints after config updates.

## Security Verification Checklist Issues

### Rate Limit test does not return 429

#### Checks
- Confirm you are hitting rate-limited auth routes (for example `/api/auth/login`, `/api/auth/community/login`, `/api/auth/lgu/login`).
- Ensure repeated requests are inside the limiter window.
- Verify request path/method exactly match the protected route.

#### Fix Steps
1. Re-run rapid repeated requests on the same route.
2. Confirm response eventually returns `429`.
3. Check audit events for `SECURITY_RATE_LIMIT_HIT`.

### Generic login error behavior is inconsistent

#### Checks
- Compare wrong-email and wrong-password responses on the same login endpoint.
- Verify both cases return the same invalid credentials pattern.

#### Fix Steps
1. Retest with controlled inputs and identical request shape.
2. Confirm status remains `401` for invalid credentials.
3. Review auth route used (community, LGU, or general auth) to avoid mixing flows.

### Logout does not invalidate token

#### Checks
- Ensure logout call is made with a valid Bearer token.
- Reuse the same token on a protected route after logout.
- Confirm token includes `jti` and blocklist lookup is active.

#### Fix Steps
1. Login and capture token.
2. Call `POST /api/auth/logout` with that token.
3. Retry `GET /api/auth/me` with the same token; expect `401`.

### CSRF test not reproducing expected 403/200

#### Checks
- Browser-origin request should include `Origin`/`Referer`.
- Call `GET /api/security/csrf` first to obtain token.
- Unsafe method must include `x-csrf-token` and cookie.

#### Fix Steps
1. Test unsafe request without token/header for expected `403`.
2. Add `x-csrf-token` from bootstrap response and retry.
3. Confirm request succeeds when CSRF requirements are met.

### Audit event not visible after security test

#### Checks
- Query `/api/audit` with admin/LGU credentials.
- Filter by expected event type (for example `AUTH_LOGIN_FAIL`, `SECURITY_ACCESS_DENIED`, `SECURITY_CSRF_FAIL`).
- Verify time window and pagination (`page`, `limit`) are sufficient.

#### Fix Steps
1. Re-run the triggering test case once.
2. Query `/api/audit?eventType=<EVENT>&page=1&limit=20`.
3. Inspect `requestId` and `correlationId` fields for traceability.

## Common Fix Sequence

1. Confirm environment variables and restart service.
2. Run `pnpm typecheck` and `pnpm build`.
3. Validate `/health` and one protected route using a fresh token.
4. Re-test CSRF flow (web) and auth flow (mobile/web).
5. Inspect server logs and `audit_logs` for context.
6. If validating security controls for presentation, follow `apps/server/docs/SECURITY_CHECKLIST_TESTS.md` end-to-end.
