# Lifeline API Catalog

This document reflects the current backend routes in `apps/server/src`.

Last updated: 2026-03-24

## Base URL

- Local API base: `http://localhost:5000`
- Health: `GET /health`
- Most endpoints are mounted under `/api`

## Authentication and Security

## Access token input

Protected routes accept either:

- `Authorization: Bearer <access_token>`
- Auth cookie (default cookie name `accessToken`, configurable via `AUTH_ACCESS_COOKIE_NAME`)

Mobile clients can send `x-client-platform: mobile` to receive token in response body on login flows.

## CSRF behavior

CSRF is enforced for unsafe methods (`POST`, `PATCH`, `PUT`, `DELETE`) only for browser-origin requests.

- CSRF bootstrap endpoint: `GET /api/security/csrf`
- Header for unsafe browser calls: `x-csrf-token: <token>`
- Mobile or non-browser requests (no `Origin` and no `Referer`) bypass CSRF.

## Role model

- Roles: `ADMIN`, `LGU`, `VOLUNTEER`, `COMMUNITY`
- Admin tiers: `SUPER`, `CDRRMO`
- Additional permission checks use RBAC role profiles (`requirePerm`).

## Rate limits

- Login limiter: 10 requests / 15 minutes
- OTP limiter: 5 requests / 10 minutes
- Password reset limiter: 5 requests / 10 minutes
- Community register limiter: 10 requests / 15 minutes
- Guest emergency report limiter: 5 requests / 5 minutes
- Guest emergency photo upload limiter: 10 requests / 5 minutes
- Routing optimize limiter: 30 requests / 60 seconds

## Common response patterns

- Success (varies per module): `{ "success": true, ... }` or `{ "data": ... }`
- Error (varies per module):
  - `{ "message": "..." }`
  - `{ "success": false, "error": "..." }`
  - global errors may include `{ "error": "...", "code": "..." }`

## HTTP Endpoints

## Public and utility routes

- `GET /health`
- `GET /uploads/profile-avatars/:filename` (public)
- `GET /uploads/dispatch-proofs/:filename` (auth + ownership check)
- `GET /uploads/emergency-report-photos/:filename` (role: `VOLUNTEER|LGU|ADMIN`)

## Security

- `GET /api/security/csrf` (public)

## Auth

- `POST /api/auth/login` (general email/password login)
- `POST /api/auth/google` (Google login)
- `POST /api/auth/set-password` (auth required)
- `POST /api/auth/link-google` (auth required)
- `GET /api/auth/me` (auth required)
- `PATCH /api/auth/me` (auth required)
- `POST /api/auth/logout` (auth required)

Community and volunteer auth

- `POST /api/auth/community/register`
- `POST /api/auth/community/login`

LGU and admin auth

- `POST /api/auth/lgu/login`
- `POST /api/auth/admin/mfa/verify`

Signup OTP flow

- `POST /api/auth/signup`
- `POST /api/auth/signup/verify-otp`
- `POST /api/auth/signup/resend-otp`

Password reset OTP flow

- `POST /api/auth/password/forgot`
- `POST /api/auth/password/verify-otp`
- `POST /api/auth/password/reset`

## Emergencies

- `POST /api/emergencies/sos` (role: `COMMUNITY|VOLUNTEER|LGU|ADMIN`)
- `GET /api/emergencies/reports` (role: `LGU|ADMIN`)

## Emergency reports

- `POST /api/emergency/reports` (guest or auth)
- `POST /api/emergency/reports/photos` (guest or auth)
- `GET /api/emergency/reports/my/active` (auth)
- `GET /api/emergency/reports/my` (auth)
- `GET /api/emergency/reports/my/counts` (auth)
- `GET /api/emergency/reports/my/map` (auth)
- `PATCH /api/emergency/reports/my/:id/cancel` (auth)
- `GET /api/emergency/reports/my/:id/tracking` (auth)
- `GET /api/emergency/reports/map` (public)
- `GET /api/emergency/reports/ref/:referenceNumber` (public)
- `GET /api/emergency/reports/:id` (guest or auth)

LGU emergency approval queue

- `GET /api/lgu/approvals/emergency-reports` (role: `LGU|ADMIN`)
- `PATCH /api/lgu/approvals/emergency-reports/:id/approve` (role: `LGU|ADMIN`)
- `PATCH /api/lgu/approvals/emergency-reports/:id/reject` (role: `LGU|ADMIN`)

## Volunteer applications

- `POST /api/volunteer-applications` (role: `COMMUNITY|VOLUNTEER`)
- `GET /api/volunteer-applications/me/latest` (role: `COMMUNITY|VOLUNTEER`)
- `POST /api/volunteer-applications/:id/review` (role: `LGU|ADMIN`)
- `GET /api/volunteer-applications` (role: `LGU|ADMIN`)
- `GET /api/volunteer-applications/:id` (role: `LGU|ADMIN`)

## Hazard zones

- `GET /api/hazard-zones` (auth)
- `POST /api/hazard-zones` (role: `LGU|ADMIN`)
- `DELETE /api/hazard-zones/:id` (role: `LGU|ADMIN`)
- `PATCH /api/hazard-zones/:id/status` (role: `LGU|ADMIN`)

## Users

- `GET /api/users/me/profile-summary` (auth)
- `GET /api/users/profile-skill-options` (auth)
- `POST /api/users/me/avatar` (auth)
- `DELETE /api/users/me/avatar` (auth)
- `GET /api/users/volunteers` (role: `LGU|ADMIN`)

## Dispatches

- `POST /api/dispatches` (role: `LGU|ADMIN`)
- `GET /api/dispatches` (role: `LGU|ADMIN`)
- `GET /api/dispatches/my/pending` (role: `VOLUNTEER`)
- `GET /api/dispatches/my/active` (role: `VOLUNTEER`)
- `GET /api/dispatches/my/current` (role: `VOLUNTEER`)
- `GET /api/dispatches/my/focus-stats` (role: `VOLUNTEER`)
- `PATCH /api/dispatches/:id/respond` (role: `VOLUNTEER`)
- `POST /api/dispatches/:id/proof` (role: `VOLUNTEER`)
- `PATCH /api/dispatches/:id/complete` (role: `VOLUNTEER`)
- `PATCH /api/dispatches/:id/location` (role: `VOLUNTEER`)
- `POST /api/dispatches/:id/verify` (role: `LGU|ADMIN`)
- `PATCH /api/dispatches/:id/verify` (role: `LGU|ADMIN`)
- `POST /api/dispatches/:id/revoke` (role: `ADMIN`)
- `POST /api/dispatches/:id/reverify` (role: `ADMIN`)

## Audit

- `GET /api/audit` (role: `ADMIN|LGU`, perm: `audit.view`)
- `GET /api/audit/:eventId` (role: `ADMIN|LGU`, perm: `audit.view`)
- `GET /api/audit/export/csv` (role: `ADMIN`, tier: `SUPER`, perm: `audit.export`)

## Notifications and push state

- `POST /api/notifications/push-token` (auth)
- `DELETE /api/notifications/push-token` (auth)
- `GET /api/notifications/push-token/me` (auth)
- `POST /api/notifications/push-test/me` (auth)
- `POST /api/notifications/state/query` (role: `LGU|ADMIN`)
- `PATCH /api/notifications/state/read` (role: `LGU|ADMIN`)
- `PATCH /api/notifications/state/archive` (role: `LGU|ADMIN`)

`/api/push` endpoints (same push token backend, alternate client API)

- `POST /api/push/register` (auth)
- `POST /api/push/unregister` (auth)
- `PATCH /api/push/preferences` (auth)
- `GET /api/push/preferences` (auth)

## Announcements

Public feed

- `GET /api/announcements/feed`

LGU-managed announcements

- `GET /api/announcements` (role: `LGU`)
- `POST /api/announcements` (role: `LGU`)
- `PATCH /api/announcements/:id` (role: `LGU`, own records)
- `POST /api/announcements/:id/publish` (role: `LGU`, own records)
- `POST /api/announcements/:id/unpublish` (role: `LGU`, own records)
- `DELETE /api/announcements/:id` (role: `LGU`, own records)

Admin-managed announcements

- `GET /api/admin/announcements` (role: `ADMIN`)
- `POST /api/admin/announcements` (role: `ADMIN`, perm: `announcements.manage`)
- `PATCH /api/admin/announcements/:id` (role: `ADMIN`, perm: `announcements.manage`)
- `POST /api/admin/announcements/:id/publish` (role: `ADMIN`, perm: `announcements.manage`)
- `POST /api/admin/announcements/:id/unpublish` (role: `ADMIN`, perm: `announcements.manage`)
- `DELETE /api/admin/announcements/:id` (role: `ADMIN`, tier: `SUPER`)

## Admin core

User management

- `GET /api/admin/users` (role: `ADMIN`, perm: `users.view`)
- `POST /api/admin/users` (role: `ADMIN`, tier: `SUPER`)
- `PATCH /api/admin/users/:id` (role: `ADMIN`, tier-based behavior)
- `POST /api/admin/users/:id/suspend` (role: `ADMIN`)
- `POST /api/admin/users/:id/reactivate` (role: `ADMIN`)

Barangay management

- `GET /api/admin/barangays` (role: `ADMIN|LGU`, perm: `barangays.view`)
- `POST /api/admin/barangays` (role: `ADMIN`, tier: `SUPER`, perm: `barangays.edit`)
- `PATCH /api/admin/barangays/:id` (role: `ADMIN`, tier: `SUPER`, perm: `barangays.edit`)
- `POST /api/admin/barangays/:id/deactivate` (role: `ADMIN`, tier: `SUPER`, perm: `barangays.edit`)
- `POST /api/admin/barangays/:id/activate` (role: `ADMIN`, tier: `SUPER`, perm: `barangays.edit`)

RBAC management

- `GET /api/admin/rbac/roles` (role: `ADMIN`, tier: `SUPER`)
- `PATCH /api/admin/rbac/roles/:key` (role: `ADMIN`, tier: `SUPER`)
- `GET /api/admin/rbac/perms` (role: `ADMIN`, tier: `SUPER`)

Master data

- `GET /api/admin/masterdata/:type` (role: `ADMIN|LGU`, perm: `masterdata.view`)
- `POST /api/admin/masterdata/:type` (role: `ADMIN`, tier: `SUPER`, perm: `masterdata.edit`)
- `PATCH /api/admin/masterdata/:type/:id` (role: `ADMIN`, tier: `SUPER`, perm: `masterdata.edit`)

Analytics

- `GET /api/admin/analytics/overview` (role: `ADMIN|LGU`, perm: `analytics.view`)
- `GET /api/admin/analytics/lgu-dashboard/stat-cards` (role: `ADMIN|LGU`, perm: `analytics.view`)

## Routing and weather

- `POST /api/routing-risk/predict` (auth)
- `POST /api/routing/optimize` (auth)
- `GET /api/weather/summary?lat=<number>&lng=<number>` (auth)

## Realtime (Socket.IO)

Socket server is initialized on the same HTTP server (`apps/server/src/realtime/notificationsSocket.ts`).

Auth token can be supplied through:

- `auth.token` in socket handshake
- `Authorization` header
- auth cookie

Key rooms/events:

- User room: `user:<userId>`
- Role room: `role:<ROLE>`
- Request room: `request:<emergencyReportId>`
- Request tracking events: `request:tracking_snapshot`, `request:tracking_update`
- Volunteer presence events: `volunteers:snapshot`, `volunteers:presence_changed`, `volunteers:location_update`
- Notification refresh event: `notifications:refresh`

## Domain statuses

Dispatch status values:

- `PENDING`, `ACCEPTED`, `DECLINED`, `CANCELLED`, `DONE`, `VERIFIED`

Volunteer application status values:

- `pending_verification`, `needs_info`, `verified`, `rejected`

Emergency report status values:

- `open`, `assigned`, `in_progress`, `resolved`, `cancelled`

Emergency verification status values:

- `not_required`, `pending`, `approved`, `rejected`

## Example: browser CSRF bootstrap

1. `GET /api/security/csrf`
2. For unsafe request, include:
   - `Authorization: Bearer <token>`
   - `x-csrf-token: <csrf token from step 1>`

## Example: dispatch verify

`POST /api/dispatches/:id/verify`

- Allowed roles: `LGU`, `ADMIN`
- Request body: `{}`
- On success: dispatch is verified, blockchain hash record is updated, and response includes `txHash`.
