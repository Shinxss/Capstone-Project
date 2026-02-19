# API Catalog

This document provides a feature-grouped API catalog for the Lifeline server.

## Base URL

- Local: `http://localhost:5000`
- All routes are mounted under `/api` unless noted.

## Authentication

### Headers

- Protected endpoints require:
  - `Authorization: Bearer <access_token>`
- For browser-based unsafe requests (`POST`, `PATCH`, `PUT`, `DELETE`), also send:
  - `x-csrf-token: <csrf_token>`

### CSRF Token Endpoint

- `GET /api/security/csrf`
  - Returns `{ "csrfToken": "..." }`
  - Sets CSRF cookie used by server validation

## Error Format

Error responses vary by feature, but typically follow one of these forms:

```json
{ "success": false, "error": "message" }
```

```json
{ "message": "message" }
```

CSRF validation failure example:

```json
{ "code": "CSRF_INVALID", "message": "CSRF token validation failed" }
```

---

## Endpoint Groups

### 1) Security

- `GET /api/security/csrf` – get CSRF token for browser clients

### 2) Auth

- `POST /api/auth/community/register`
- `POST /api/auth/community/login`
- `POST /api/auth/lgu/login`
- `POST /api/auth/admin/mfa/verify`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/signup`
- `POST /api/auth/signup/verify-otp`
- `POST /api/auth/signup/resend-otp`
- `POST /api/auth/password/forgot`
- `POST /api/auth/password/verify-otp`
- `POST /api/auth/password/reset`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/set-password`
- `POST /api/auth/link-google`

### 3) Emergencies

- `POST /api/emergencies/sos`
- `GET /api/emergencies/reports`

### 4) Hazard Zones

- `GET /api/hazard-zones`
- `POST /api/hazard-zones`
- `DELETE /api/hazard-zones/:id`
- `PATCH /api/hazard-zones/:id/status`

### 5) Volunteer Applications

- `POST /api/volunteer-applications`
- `GET /api/volunteer-applications/me/latest`
- `GET /api/volunteer-applications`
- `GET /api/volunteer-applications/:id`
- `POST /api/volunteer-applications/:id/review`

### 6) Users

- `GET /api/users/volunteers`

### 7) Dispatches

- `POST /api/dispatches`
- `GET /api/dispatches`
- `GET /api/dispatches/my/pending`
- `GET /api/dispatches/my/active`
- `GET /api/dispatches/my/current`
- `PATCH /api/dispatches/:id/respond`
- `POST /api/dispatches/:id/proof`
- `PATCH /api/dispatches/:id/complete`
- `PATCH /api/dispatches/:id/verify`

### 8) Uploads (non-`/api` route)

- `GET /uploads/dispatch-proofs/:filename`
  - Requires LGU/Admin auth

---

## Request/Response Examples

### Example A: Community Login

`POST /api/auth/community/login`

Request:

```json
{
  "email": "community@example.com",
  "password": "StrongPass123"
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "user": {
      "id": "...",
      "role": "COMMUNITY"
    }
  }
}
```

### Example B: Browser CSRF Bootstrap

1) `GET /api/security/csrf`

Response:

```json
{ "csrfToken": "<token>" }
```

2) Send unsafe request with headers:
- `Authorization: Bearer <jwt>`
- `x-csrf-token: <token>`

### Example C: Post Volunteer Application

`POST /api/volunteer-applications`

Request (shortened):

```json
{
  "fullName": "Juan Dela Cruz",
  "barangay": "Example Barangay",
  "consent": {
    "truth": true,
    "rules": true,
    "data": true
  }
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "PENDING"
  }
}
```

## Auth Requirements Summary

- Public: CSRF token fetch endpoint, selected auth endpoints
- Authenticated: most feature routes
- Role-restricted:
  - LGU/Admin: hazard writes, volunteer review/listing, dispatch creation/listing
  - Volunteer: dispatch response/proof/complete + self dispatch queries
  - Community/Volunteer: volunteer application submission and self-latest lookup
