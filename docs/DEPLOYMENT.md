# Deployment Guide

This guide covers production deployment for the Lifeline server API.

## 1) Production Environment Variables (No Secrets Included)

Create environment values for these keys:

- Runtime:
  - `NODE_ENV`
  - `PORT`
- Database:
  - `MONGODB_URI`
- Auth:
  - `JWT_ACCESS_SECRET`
  - `JWT_SECRET`
  - `JWT_ACCESS_EXPIRES_IN`
- Security/CORS:
  - `CORS_ORIGINS`
  - `CSRF_SECRET`
- Email/OTP:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_SECURE`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM`
- OAuth:
  - `GOOGLE_WEB_CLIENT_ID`
  - `GOOGLE_ANDROID_CLIENT_ID`
- Blockchain verification (if dispatch verification is enabled):
  - `SEPOLIA_RPC_URL`
  - `SEPOLIA_PRIVATE_KEY`
  - `TASK_LEDGER_CONTRACT_ADDRESS`

## 2) Build and Start Steps

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

If `pnpm start` is not configured in your runtime environment, run the built entrypoint directly from `dist` using your process manager.

Recommended process managers: PM2, systemd, container orchestrator, or platform-native supervisor.

## 3) MongoDB Atlas Notes

- Use a dedicated production cluster and database user with least privilege.
- Restrict network access using IP allowlists or private networking.
- Enable backups and point-in-time restore where available.
- Keep connection string in `MONGODB_URI` and never commit credentials.
- Ensure indexes are pre-provisioned for production (app disables auto-index in production).

## 4) CORS Origins

Set `CORS_ORIGINS` as a comma-separated allowlist of trusted frontend origins, for example:

```text
https://web.lifeline.example,https://admin.lifeline.example
```

Do not use wildcard origins in production for authenticated endpoints.

## 5) CSRF Cookie Settings (Production)

Current CSRF middleware uses double-submit cookie strategy with:

- `httpOnly: true`
- `sameSite: "lax"`
- `path: "/"`
- `secure: true` when `NODE_ENV=production`

Production checklist:
- Serve app over HTTPS only.
- Keep CSRF secret strong and rotated periodically.
- Ensure browser clients call `GET /api/security/csrf` before unsafe requests.

## 6) Recommended Hosting Notes (Generic)

- Run behind a reverse proxy or managed load balancer.
- Terminate TLS at edge and forward trusted headers correctly.
- Configure health checks using `GET /health`.
- Persist and monitor logs (application + access + security).
- Mount `uploads/` on durable storage if local disk is ephemeral.
- Apply autoscaling and memory limits based on traffic profile.
