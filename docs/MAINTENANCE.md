# Maintenance Notes

## 1) Secret Rotation Routine

Rotate high-risk secrets on a schedule (for example every 60–90 days) or immediately after incident suspicion.

### Secrets to rotate

- JWT secrets:
  - `JWT_ACCESS_SECRET`
  - `JWT_SECRET`
- CSRF secret:
  - `CSRF_SECRET`
- SMTP credentials:
  - `SMTP_USER`
  - `SMTP_PASS`
- Blockchain verification keys:
  - `SEPOLIA_PRIVATE_KEY`
  - related RPC and contract settings if changed

### Rotation checklist

1. Generate new secrets in a secure secrets manager.
2. Update deployment environment values.
3. Restart/redeploy services.
4. Verify login, CSRF, OTP email, and dispatch verification paths.
5. Document rotation date and operator.

## 2) Dependency Update Routine

- Weekly:
  - Check outdated packages (`pnpm outdated`).
  - Apply patch/minor updates where safe.
- Monthly:
  - Review major version candidates.
  - Re-run manual security checklist after major changes.
- Every release:
  - Build + typecheck (`pnpm build`, `pnpm typecheck`).

## 3) Monitoring and Audit Log Review

### Monitor continuously

- API error rates and latency
- authentication failure spikes
- OTP/MFA failure spikes
- unusual rate-limit bursts
- DB connectivity and timeout errors

### Audit log review

Audit records are written to `audit_logs` collection.

Review at least weekly for:
- repeated auth failures
- unusual role-based actions
- unexpected hazard/dispatch/volunteer review operations

## 4) Incident Response Mini Checklist

1. Triage
   - Identify scope (users, routes, data affected).
2. Contain
   - Revoke suspicious tokens/sessions.
   - Rotate compromised credentials.
   - Temporarily restrict affected endpoints if needed.
3. Eradicate
   - Patch root cause and validate fix.
4. Recover
   - Restore normal operations and monitor closely.
5. Post-incident
   - Document timeline, impact, and follow-up actions.
   - Add/adjust tests or runbooks to prevent recurrence.
