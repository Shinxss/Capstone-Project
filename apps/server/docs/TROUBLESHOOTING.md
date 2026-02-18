# Troubleshooting

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

## Common Fix Sequence

1. Confirm environment variables and restart service.
2. Run `pnpm typecheck` and `pnpm build`.
3. Validate `/health` and one protected route using a fresh token.
4. Re-test CSRF flow (web) and auth flow (mobile/web).
5. Inspect server logs and `audit_logs` for context.
