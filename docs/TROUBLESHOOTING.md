# Troubleshooting

Common issues for the current `apps/server` backend.

Last updated: 2026-03-24

## 1) Server fails at startup

Symptoms:

- process exits immediately
- startup error in terminal

Checks:

- `MONGODB_URI` exists and is valid
- `PORT` is numeric
- required secrets are loaded in runtime environment

Fix steps:

1. Verify env file or secret injection.
2. Start with explicit command from server package:
   - `pnpm --filter server dev` (local)
   - `pnpm --filter server build && node apps/server/dist/server.js` (build run)
3. Recheck startup logs.

## 2) MongoDB connection issues

Symptoms:

- timeout or connection refused
- requests hang or fail with DB errors

Checks:

- Atlas IP allowlist / VPC rules
- username/password in URI
- cluster availability

Fix steps:

1. Test connection string externally.
2. Confirm DNS/network from deployment environment.
3. Restart service after correcting URI.

## 3) CORS errors in browser

Symptoms:

- blocked by CORS policy
- cookie/token not sent

Checks:

- `CORS_ORIGINS` includes exact frontend origin
- frontend sends credentials where needed

Fix steps:

1. Add exact origin(s) to `CORS_ORIGINS`.
2. Restart backend.
3. Clear browser cache and retest.

## 4) CSRF `403` on web requests

Symptoms:

- response contains `CSRF_INVALID`
- unsafe browser requests fail

Checks:

- `GET /api/security/csrf` called first
- unsafe request sends `x-csrf-token`
- cookie is returned and sent back

Fix steps:

1. Bootstrap CSRF token again.
2. Include `x-csrf-token` in unsafe call.
3. Keep auth and CSRF requests on same trusted origin.

## 5) `401 Unauthorized` or `Invalid token`

Checks:

- `Authorization: Bearer <token>` format
- token not expired
- token not blocklisted after logout

Fix steps:

1. Re-login for fresh token.
2. Confirm client is not using stale cached token.
3. Ensure all API instances share same `JWT_ACCESS_SECRET`.

## 6) Login and OTP issues

Symptoms:

- OTP not delivered
- admin MFA cannot complete

Checks:

- SMTP env values (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`)
- sender policy and SMTP provider restrictions

Fix steps:

1. Test SMTP credentials with provider tools.
2. Confirm secure/port combination.
3. In production, do not rely on dev fallback logging.

## 7) Google login or link fails

Checks:

- `GOOGLE_WEB_CLIENT_ID` and/or `GOOGLE_ANDROID_CLIENT_ID`
- Google token audience matches backend client IDs
- account email is verified at Google

Fix steps:

1. Update backend env client IDs.
2. Rebuild/restart service.
3. Retry with fresh Google ID token.

## 8) Routing optimize fails

Symptoms:

- `/api/routing/optimize` returns 500/502/409

Checks:

- `MAPBOX_TOKEN` is present
- start/end coordinates are valid
- network egress to Mapbox is available

Fix steps:

1. Set valid `MAPBOX_TOKEN`.
2. Retry with nearby destination when no viable route is found.
3. Confirm rate limit is not being hit.

## 9) Routing-risk model unavailable

Symptoms:

- predictions succeed but look defaulted
- warning about ONNX inference disabled

Checks:

- `ROUTING_RISK_ONNX_PATH`
- `ROUTING_RISK_META_PATH`
- model file exists and is readable

Fix steps:

1. Deploy model and meta files.
2. Ensure paths are absolute or correctly resolved from process cwd.
3. Restart service.

## 10) Weather data fallback responses

Symptoms:

- weather endpoint returns "Weather unavailable"

Checks:

- network access to Open-Meteo API
- outbound timeout constraints

Fix steps:

1. Verify outbound internet from server.
2. Retry request after cache TTL.
3. Monitor logs for `[weather] open-meteo fetch failed`.

## 11) Push notifications not delivered

Checks:

- valid Expo push token format
- `EXPO_ACCESS_TOKEN` configured where required
- token active in DB

Fix steps:

1. Re-register push token using `/api/push/register` or `/api/notifications/push-token`.
2. Send `/api/notifications/push-test/me`.
3. Inspect Expo ticket errors and deactivate invalid tokens.

## 12) Dispatch verify/revoke/reverify fails

Symptoms:

- blockchain verification routes return error

Checks:

- `SEPOLIA_RPC_URL`
- `SEPOLIA_PRIVATE_KEY`
- `TASK_LEDGER_CONTRACT_ADDRESS`
- signer account has funds and contract permissions

Fix steps:

1. Validate RPC endpoint reachability.
2. Validate private key and chain network.
3. Confirm contract address and ABI compatibility.

## 13) File upload or proof retrieval issues

Symptoms:

- proof upload rejected
- file endpoint returns 404/403/500

Checks:

- payload follows schema (`base64`, mime type, size)
- file exists in `uploads/...`
- requester has permission for proof access
- encryption key compatibility (`AES_KEY_HEX` or fallback key source)

Fix steps:

1. Retry upload with supported mime (`image/png`, `image/jpeg`, `image/heic`).
2. Confirm role/ownership for proof read endpoint.
3. Keep encryption key stable for existing files.

## 14) Audit routes return `403`

Checks:

- role is `ADMIN` or `LGU` for audit view
- role profile includes `audit.view`
- CSV export additionally requires `ADMIN` + `SUPER` + `audit.export`

Fix steps:

1. Inspect role profile permissions.
2. Reseed RBAC if profiles are stale.
3. Retry with proper admin tier account.

## 15) Socket connection unauthorized

Checks:

- socket handshake token is valid
- token not blocklisted
- user account is active

Fix steps:

1. Re-authenticate and reconnect socket.
2. Ensure reverse proxy forwards auth headers/cookies.
3. Keep `CORS_ORIGINS` consistent with socket client origin.

## 16) Quick maintenance commands

```bash
pnpm --filter server typecheck
pnpm --filter server test
pnpm --filter server seed:rbac
pnpm --filter server seed:system-admin
```

## 17) Related docs

- [API.md](./API.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [MAINTENANCE.md](./MAINTENANCE.md)
- [security_documentation.md](./security_documentation.md)
- [task-ledger-v2-migration.md](./task-ledger-v2-migration.md)
