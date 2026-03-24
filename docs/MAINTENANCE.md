# Maintenance Runbook

This runbook is for ongoing operations of `apps/server`.

Last updated: 2026-03-24

## 1) Daily checks

- Confirm API health: `GET /health`
- Review error logs for startup, Mongo, auth, routing, and blockchain failures
- Review audit events for suspicious activity (`SECURITY_*`, auth failures, role changes)
- Watch queue health for emergency reports and dispatch updates

## 2) Weekly checks

- Verify OTP and MFA flow still sends emails
- Verify one volunteer dispatch cycle (create -> respond -> proof -> complete -> verify)
- Verify one CSRF-protected browser request end-to-end
- Review inactive/invalid Expo tokens and push send errors
- Confirm `uploads/` storage usage and retention strategy

## 3) Monthly checks

- Dependency review and updates
  - `pnpm outdated`
  - `pnpm --filter server typecheck`
  - `pnpm --filter server test`
- Security review of role permissions and admin access
- Backup restore rehearsal in non-production

## 4) Secret rotation routine

Rotate or reissue on schedule, and immediately on incident suspicion.

High-priority secrets:

- `JWT_ACCESS_SECRET`
- `CSRF_SECRET`
- SMTP credentials (`SMTP_USER`, `SMTP_PASS`)
- Google OAuth client IDs (if rotated by provider)
- `SEPOLIA_PRIVATE_KEY` (if blockchain verification is enabled)
- `MAPBOX_TOKEN` and `EXPO_ACCESS_TOKEN` as required
- `AES_KEY_HEX` (plan carefully; affects encrypted file readability)

Rotation checklist:

1. Update secrets in vault.
2. Deploy updated env vars.
3. Restart service.
4. Smoke test auth, CSRF, OTP, routing, push, and blockchain verify routes.
5. Record rotation date and operator.

## 5) Database operations

## Backups

- Enable continuous or scheduled MongoDB backups.
- Keep retention policy aligned with capstone/data governance requirements.

## Restore drill

1. Restore latest snapshot into staging.
2. Start backend against restored DB.
3. Validate auth login, emergency list, dispatch list, audit queries.
4. Document recovery time and gaps.

## 6) RBAC and admin maintenance

- Seed/refresh role profiles when permission sets change:

```bash
pnpm --filter server seed:rbac
```

- Ensure SUPER admin exists and can access RBAC/audit export/admin account routes.
- Review manual user-level permission overrides on admin accounts.

## 7) Data integrity checks

## Dispatch and blockchain

- Sample verified dispatch rows:
  - ensure `status=VERIFIED`
  - ensure `blockchain` object is present for new records
  - legacy `chainRecord` may exist for backward compatibility

## Upload integrity

- Confirm proof images can be decrypted and served from `/uploads/dispatch-proofs/:filename`.
- If rotating `AES_KEY_HEX`, run migration/re-encryption plan before cutover.

## 8) Routing model upkeep

- Verify ONNX model and metadata files are present at configured paths.
- If missing, service falls back to default risk outputs; track this in ops logs.
- If `LOG_ROUTING_RISK=1`, rotate `ROUTING_RISK_LOG_PATH` outputs.

## 9) Performance and capacity

- Track API p95 latency and route-specific outliers (`/api/routing/optimize`, dispatch verify).
- Monitor Mongo connection pool behavior and slow queries.
- Review Socket.IO connection counts and reconnect churn.

## 10) Incident response mini-checklist

1. Triage impact scope (roles, routes, data).
2. Contain (disable affected feature, rotate compromised secrets, revoke sessions).
3. Eradicate root cause and patch.
4. Recover and monitor closely.
5. Record timeline, impact, and preventive action items.
