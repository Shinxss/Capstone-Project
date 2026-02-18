# Lifeline Mobile (Expo)

Mobile client for community and volunteer workflows in the Lifeline emergency response platform.

## Expo Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env` in `apps/mobile` with required variables.

3. Run Android build:

```bash
pnpm android
```

Optional local dev server:

```bash
pnpm start
```

## Environment Variables

- `EXPO_PUBLIC_API_URL` (required)
  - Base URL of Lifeline backend (example: `http://10.0.2.2:5000` for Android emulator)
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` (required for Google auth)
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (required for Google auth flow)
- `EXPO_PUBLIC_MAPBOX_TOKEN` (required for map tab)

## API Base URL Configuration

- API client is configured in `lib/api.ts`.
- `baseURL` is read from `EXPO_PUBLIC_API_URL`.
- Feature services call backend paths under `/api/...`.

## Authentication Token Storage Notes

- Primary token/session state is persisted in `AsyncStorage`.
- Legacy token compatibility path also reads from secure storage (`expo-secure-store`).
- Axios request interceptor attaches `Authorization: Bearer <token>` automatically when available.

## Push Notifications / WebSockets Notes

- `socket.io-client` is present as a dependency, but no active socket connection flow is currently wired in app code.
- Native push notification handling is not currently implemented in this codebase.

## Related Modules

- Auth/session bootstrap and login flows: `features/auth`
- Emergency SOS submission: `features/emergency`
- Volunteer application flow: `features/volunteer`
- Dispatch task workflow: `features/dispatch`
