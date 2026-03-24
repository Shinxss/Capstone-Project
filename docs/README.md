# Lifeline Documentation Index

This folder contains the final backend documentation for the Lifeline capstone build.

Last updated: 2026-03-24

## Documents

- [API.md](./API.md) - REST API endpoint catalog, auth rules, and realtime socket events.
- [DEPLOYMENT.md](./DEPLOYMENT.md) - production deployment checklist and required environment variables.
- [MAINTENANCE.md](./MAINTENANCE.md) - routine operations, backups, health checks, and incident runbook.
- [security_documentation.md](./security_documentation.md) - implemented security controls and verification guidance.
- [task-ledger-v2-migration.md](./task-ledger-v2-migration.md) - migration and compatibility notes for dispatch blockchain records.
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - common failures and quick fixes for auth, routing, blockchain, push, and uploads.

## Scope

These docs describe the current backend in `apps/server`.

They cover:

- HTTP API endpoints mounted from `apps/server/src/features`.
- Realtime socket behavior from `apps/server/src/realtime/notificationsSocket.ts`.
- Deployment and operational requirements for MongoDB, auth, CSRF, routing, OTP mail, push notifications, and optional blockchain verification.

If code behavior and docs disagree, treat code as source of truth and update docs in this folder.
