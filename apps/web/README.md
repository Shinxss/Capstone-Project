# Lifeline Web (LGU/Admin)

Web client for LGU/Admin operations in the Lifeline emergency volunteer response platform.

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env` in `apps/web` with required variables (see below).

3. Run development server:

```bash
pnpm dev
```

4. Build for production:

```bash
pnpm build
```

## Environment Variables

- `VITE_API_URL` (required)
  - Example: `http://localhost:5000`
- `VITE_MAPBOX_TOKEN` (required for map screens)
- `VITE_USE_PROFILE_API` (optional, set to `1` to enable profile API calls)

## Backend Connection and Auth

- API client is configured in `src/lib/api.ts`.
- `VITE_API_URL` is used as base URL.
- Access tokens are sent as `Authorization: Bearer <token>`.
- Browser requests include credentials (`withCredentials: true`) for CSRF cookie handling.

## CSRF Token Flow

For browser unsafe methods (`POST`, `PATCH`, `PUT`, `DELETE`):

1. On app boot, web client calls:
   - `GET /api/security/csrf`
2. Server returns `{ csrfToken }` and sets CSRF cookie.
3. Web client stores token in memory.
4. Unsafe requests send header:
   - `x-csrf-token: <csrfToken>`

If token/cookie is missing or invalid, server responds with `403` (`CSRF_INVALID`).

## Main Screens / Modules

- Auth
  - `Login`
- LGU Core
  - `Dashboard`, `Notifications`, `Emergencies`, `Live Map`
- Volunteers
  - `Applicants`, `Verified Volunteers`
- Tasks
  - `In Progress`, `For Review`, `Completed`, `Canceled`
- Operations
  - `Approvals`, `Activity Log`, `Reports`, `Announcements`
- User
  - `Profile`, `Settings`

Route definitions are in `src/App.tsx`.
