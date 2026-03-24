# Deployment Guide

This guide covers deployment of the current Lifeline backend in `apps/server`.

Last updated: 2026-03-24

## 1) Prerequisites

- Node.js 20+ recommended
- pnpm 10+
- MongoDB (Atlas or self-managed)
- HTTPS reverse proxy (required in production)

## 2) Build and start

From repository root:

```bash
pnpm install --frozen-lockfile
pnpm --filter server build
node apps/server/dist/server.js
```

Or from `apps/server`:

```bash
pnpm install --frozen-lockfile
pnpm build
node dist/server.js
```

For local development:

```bash
pnpm --filter server dev
```

## 3) Required environment variables

## Core runtime

- `NODE_ENV` (`production` in live environments)
- `PORT`
- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `CSRF_SECRET`
- `CORS_ORIGINS` (comma-separated list of trusted web origins)

## Email and OTP (required in production)

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (`true` or `false`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (optional; falls back to `SMTP_USER`)

## OAuth (required only if Google login/link is enabled)

- `GOOGLE_WEB_CLIENT_ID`
- `GOOGLE_ANDROID_CLIENT_ID`

## Routing and maps (required for route optimization)

- `MAPBOX_TOKEN`

## Blockchain verification (required for dispatch verify/revoke/reverify)

- `SEPOLIA_RPC_URL`
- `SEPOLIA_PRIVATE_KEY`
- `TASK_LEDGER_CONTRACT_ADDRESS`
- `TASK_LEDGER_NETWORK` (optional; defaults to `sepolia`)

## Push notifications (optional)

- `EXPO_ACCESS_TOKEN` (used by Expo push service)

## Optional tuning and compatibility vars

- `JWT_ACCESS_EXPIRES_IN`
- `JWT_MOBILE_ACCESS_EXPIRES_IN`
- `JSON_BODY_LIMIT` (default `6mb`)
- `DISPATCH_PENDING_RESPONSE_TIMEOUT_MS`
- `AUTH_ACCESS_COOKIE_NAME`
- `AUTH_COOKIE_SECURE`
- `AUTH_COOKIE_SAME_SITE`
- `AUTH_COOKIE_DOMAIN`
- `AES_KEY_HEX` (recommended for stable file encryption key)
- `JWT_SECRET` (fallback source when `AES_KEY_HEX` is missing)
- `ROUTING_RISK_ONNX_PATH`
- `ROUTING_RISK_META_PATH`
- `LOG_ROUTING_RISK`
- `ROUTING_RISK_LOG_PATH`
- `FLOOD_ROADS_COLLECTION`

## 4) Feature behavior when env is missing

- Missing `MONGODB_URI`: server exits on startup.
- Missing SMTP in production: OTP and MFA emails fail.
- Missing Mapbox token: `/api/routing/optimize` returns error.
- Missing blockchain vars: dispatch verify/revoke/reverify fails.
- Missing routing-risk model files: API still works with fallback model outputs.

## 5) Production hardening checklist

- Serve API behind HTTPS only.
- Configure strict `CORS_ORIGINS` values (no wildcard for authenticated clients).
- Store secrets in a secrets manager, not in committed files.
- Keep `uploads/` on durable storage if instances are ephemeral.
- Enable MongoDB backups and test restore procedure.
- Use process manager supervision (`systemd`, PM2, Docker orchestrator).
- Collect logs and metrics (error rate, latency, auth failures, rate limits).

## 6) Reverse proxy notes

The app trusts one proxy hop (`app.set("trust proxy", 1)`).

Ensure proxy forwards:

- `X-Forwarded-For`
- `X-Forwarded-Proto`

## 7) Socket.IO scaling note

Realtime notifications run on the same HTTP server.

For multi-instance deployments, use sticky sessions and a shared Socket.IO adapter (for example Redis adapter) so room broadcasts stay consistent.

## 8) Post-deploy smoke checks

1. `GET /health` returns `{ "ok": true }`.
2. Auth login flow works for at least one account.
3. Browser CSRF flow works (`/api/security/csrf` then unsafe request).
4. `GET /api/auth/me` works with fresh token.
5. One protected LGU route and one volunteer route succeed.
6. If enabled: send push test and verify dispatch blockchain endpoint.
