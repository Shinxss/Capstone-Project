# SECURITY_CHECKLIST_TESTS

Base URL used below: `http://localhost:5000`

Use these helper variables in terminal:

```bash
BASE_URL=http://localhost:5000
COMMUNITY_TOKEN=<community_access_token>
LGU_TOKEN=<lgu_access_token>
ADMIN_TOKEN=<admin_access_token>
VOLUNTEER_TOKEN=<volunteer_access_token>
DISPATCH_ID=<dispatch_offer_id>
HAZARD_ID=<hazard_zone_id>
VOL_APP_ID=<volunteer_application_id>
```

## 1) Rate Limiting For Login/Auth Endpoints

- Checklist item: Rate limiting for logins and auth-related endpoints
- Files:
  - `apps/server/src/middlewares/rateLimit.ts`
  - `apps/server/src/features/auth/auth.routes.ts`
  - `apps/server/src/features/auth/auth.community.routes.ts`
  - `apps/server/src/features/auth/auth.lgu.routes.ts`
  - `apps/server/src/features/auth/auth.admin.routes.ts`
- How to test:
  - Send 11 wrong login requests quickly to one endpoint, example:

```powershell
for ($i=1; $i -le 11; $i++) {
  curl.exe -s -o NUL -w "%{http_code}`n" -X POST "http://localhost:5000/api/auth/community/login" -H "Content-Type: application/json" -d '{"email":"wrong@example.com","password":"Wrong123"}'
}
```

- Expected:
  - Early attempts: `401`
  - After limit exceeded: `429` with JSON message similar to:

```json
{ "message": "Too many requests, please try again later." }
```

- Screenshot evidence:
  - Postman collection runner or terminal output showing transition to `429`.

## 2) Generic Login Errors (Non-Enumerable)

- Checklist item: Generic login errors across login endpoints
- Files:
  - `apps/server/src/features/auth/auth.community.routes.ts`
  - `apps/server/src/features/auth/auth.lgu.routes.ts`
  - `apps/server/src/features/auth/auth.controller.ts`
  - `apps/server/src/features/auth/auth.google.controller.ts`
- How to test:
  - Test each condition on `/api/auth/community/login`, `/api/auth/lgu/login`, and `/api/auth/google`:
    - Wrong username/email
    - Wrong password
    - Disabled user
    - Unverified community user
  - Example:

```bash
curl -i -X POST "$BASE_URL/api/auth/community/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"notfound@example.com","password":"Wrong123"}'
```

- Expected:
  - All auth-failure cases return `401` with the same error text:

```json
{ "success": false, "error": "Invalid credentials" }
```

  - For Google misconfiguration (missing Google client IDs on server), `/api/auth/google` returns `500` with:

```json
{ "success": false, "error": "Google login failed." }
```

- Screenshot evidence:
  - Side-by-side Postman responses for different failure scenarios showing identical `401` and error string.

## 3) Strong Password Policy Everywhere

- Checklist item: Strong password policy (>=8, at least 1 letter + 1 number)
- Files:
  - `apps/server/src/features/auth/password.policy.ts`
  - `apps/server/src/features/auth/auth.schemas.ts`
  - `apps/server/src/features/auth/auth.community.routes.ts`
  - `apps/server/src/features/auth/routes/signupOtp.routes.ts`
  - `apps/server/src/features/auth/routes/passwordReset.routes.ts`
  - `apps/server/src/features/auth/auth.google.controller.ts`
- How to test:
  - Community register weak password:

```bash
curl -i -X POST "$BASE_URL/api/auth/community/register" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"weak1@example.com","password":"123"}'
```

  - Signup OTP weak password:

```bash
curl -i -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"Otp","email":"weak2@example.com","password":"123"}'
```

  - Password reset weak password:

```bash
curl -i -X POST "$BASE_URL/api/auth/password/reset" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","resetToken":"dummy","newPassword":"123","confirmPassword":"123"}'
```

  - Set-password weak password (authenticated Google user):

```bash
curl -i -X POST "$BASE_URL/api/auth/set-password" \
  -H "Authorization: Bearer $COMMUNITY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPassword":"123","confirmPassword":"123"}'
```

- Expected:
  - `400` validation failure for weak passwords on all endpoints.
- Screenshot evidence:
  - Postman response bodies showing password policy rejection on each endpoint.

## 4) Logout Invalidates Session (Server-Side Blocklist)

- Checklist item: Logout invalidates session server-side
- Files:
  - `apps/server/src/utils/jwt.ts`
  - `apps/server/src/features/auth/TokenBlocklist.model.ts`
  - `apps/server/src/middlewares/requireAuth.ts`
  - `apps/server/src/features/auth/auth.controller.ts`
  - `apps/server/src/features/auth/auth.routes.ts`
- How to test:
  1. Login and capture token.
  2. Call `GET /api/auth/me` with token.
  3. Call `POST /api/auth/logout` with same token.
  4. Call `GET /api/auth/me` again with same token.

```bash
curl -i -H "Authorization: Bearer $COMMUNITY_TOKEN" "$BASE_URL/api/auth/me"
curl -i -X POST -H "Authorization: Bearer $COMMUNITY_TOKEN" "$BASE_URL/api/auth/logout"
curl -i -H "Authorization: Bearer $COMMUNITY_TOKEN" "$BASE_URL/api/auth/me"
```

- Expected:
  - Step 2: `200`
  - Step 3: `200` with `{ "success": true }`
  - Step 4: `401` with `{ "message": "Invalid token" }`
- Screenshot evidence:
  - Postman sequence for the 3 calls above.
  - MongoDB screenshot of a new blocklist record in `tokenblocklists` with `jti` and `expiresAt`.

## 5) Global NoSQL Injection Protection

- Checklist item: Global NoSQL injection sanitization
- Files:
  - `apps/server/src/app.ts`
- How to test:

```bash
curl -i -X POST "$BASE_URL/api/auth/community/login" \
  -H "Content-Type: application/json" \
  -d '{"email":{"$ne":null},"password":{"$ne":null}}'
```

- Expected:
  - Request does not bypass auth; returns `400` (validation) or `401` (invalid credentials), never authenticated.
- Screenshot evidence:
  - Request body and failed response from Postman.

## 6) XSS Hardening Headers (Helmet + CSP)

- Checklist item: Security headers with CSP and production HSTS
- Files:
  - `apps/server/src/app.ts`
- How to test:

```bash
curl -i "$BASE_URL/health"
```

- Expected headers include:
  - `content-security-policy`
  - `x-content-type-options: nosniff`
  - `x-frame-options`
  - No `x-powered-by`
  - `strict-transport-security` only when `NODE_ENV=production`
- Screenshot evidence:
  - Terminal/Postman headers tab showing security headers.

## 7) Dispatch Proof Validation (Type + Size + Magic Bytes)

- Checklist item: Dispatch proof file validation
- Files:
  - `apps/server/src/features/dispatches/dispatch.validation.ts`
  - `apps/server/src/features/dispatches/dispatch.service.ts`
  - `apps/server/src/features/dispatches/dispatch.controller.ts`
- How to test:
  - Invalid fake payload:

```bash
curl -i -X POST "$BASE_URL/api/dispatches/$DISPATCH_ID/proof" \
  -H "Authorization: Bearer $VOLUNTEER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"base64":"not-base64!!!","mimeType":"image/png","fileName":"x.png"}'
```

  - Oversized payload (>3MB decoded): expect `File too large`.
  - Valid JPG/PNG: upload valid base64 and expect success.

- Expected:
  - Invalid type/magic bytes: `400` with `Invalid file type`
  - Oversized: `400` with `File too large`
  - Valid proof: `200` with proof URL in response
  - Proof URL endpoint `/uploads/dispatch-proofs/:filename` is accessible only to `LGU/ADMIN`.
- Screenshot evidence:
  - Failed invalid upload response.
  - Failed oversized upload response.
  - Successful valid upload response with proof URL.
  - Forbidden response when non-LGU/ADMIN tries to fetch proof URL.

## 8) Audit Logging (Application Level)

- Checklist item: Audit logging enabled for security-relevant actions
- Files:
  - `apps/server/src/features/audit/audit.model.ts`
  - `apps/server/src/features/audit/audit.service.ts`
  - `apps/server/src/features/auth/auth.community.routes.ts`
  - `apps/server/src/features/auth/auth.lgu.routes.ts`
  - `apps/server/src/features/auth/auth.controller.ts`
  - `apps/server/src/features/dispatches/dispatch.controller.ts`
  - `apps/server/src/features/hazardZones/hazardZone.controller.ts`
  - `apps/server/src/features/volunteerApplications/volunteerApplication.controller.ts`
- How to test:
  - Perform these actions:
    - community login success
    - lgu login success / admin password success
    - logout
    - dispatch proof upload
    - dispatch verify
    - hazard create/delete/status
    - volunteer application submit/review
  - Query MongoDB:

```javascript
db.audit_logs.find({}, { action: 1, actorId: 1, actorRole: 1, targetType: 1, targetId: 1, metadata: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(50)
```

- Expected:
  - New records with actions:
    - `AUTH_COMMUNITY_LOGIN_SUCCESS`
    - `AUTH_LGU_LOGIN_SUCCESS`
    - `AUTH_ADMIN_PASSWORD_SUCCESS`
    - `AUTH_LOGOUT`
    - `DISPATCH_PROOF_UPLOAD`
    - `DISPATCH_VERIFY`
    - `HAZARD_CREATE`, `HAZARD_DELETE`, `HAZARD_STATUS`
    - `VOL_APP_SUBMIT`, `VOL_APP_REVIEW`
- Screenshot evidence:
  - Mongo shell/Compass showing inserted `audit_logs` records with the expected action values.

## 9) RBAC Tightening: Hazard Zones

- Checklist item: Hazard-zone write RBAC
- Files:
  - `apps/server/src/features/hazardZones/hazardZone.routes.ts`
- How to test:
  - COMMUNITY token tries create/delete/status update -> should fail.
  - LGU/ADMIN token tries create/delete/status update -> should pass.

```bash
curl -i -X POST "$BASE_URL/api/hazard-zones" \
  -H "Authorization: Bearer $COMMUNITY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Zone","hazardType":"FLOODED","geometry":{"type":"Polygon","coordinates":[[[120.0,16.0],[120.1,16.0],[120.1,16.1],[120.0,16.0]]]}}'
```

- Expected:
  - COMMUNITY write attempts: `403`
  - LGU/ADMIN writes: `200`/`201` as applicable
- Screenshot evidence:
  - One failed COMMUNITY write response and one successful LGU/ADMIN write response.

## 10) RBAC Tightening: Volunteer Applications

- Checklist item: Volunteer application route RBAC
- Files:
  - `apps/server/src/features/volunteerApplications/volunteerApplication.routes.ts`
- How to test:
  - COMMUNITY/VOLUNTEER can:
    - `POST /api/volunteer-applications`
    - `GET /api/volunteer-applications/me/latest`
  - COMMUNITY cannot:
    - `GET /api/volunteer-applications`
    - `GET /api/volunteer-applications/:id`
    - `POST /api/volunteer-applications/:id/review`
  - LGU/ADMIN can use reviewer/list routes.

- Expected:
  - Community on reviewer/list routes: `403`
  - LGU/ADMIN on reviewer/list routes: `200`
- Screenshot evidence:
  - Community `403` response for list endpoint.
  - LGU/ADMIN `200` response for same endpoint.

## 11) Web + Mobile Logout Calls Server Endpoint

- Checklist item: Client logout calls `/api/auth/logout` before local cleanup
- Files:
  - `apps/web/src/features/auth/constants/auth.constants.ts`
  - `apps/web/src/features/auth/services/lguAuth.service.ts`
  - `apps/web/src/components/Header.tsx`
  - `apps/mobile/features/auth/auth.session.ts`
- How to test:
  - Web:
    1. Login as LGU/ADMIN.
    2. Click logout in header.
    3. Confirm network call to `POST /api/auth/logout`.
    4. Retry `GET /api/auth/me` with old token -> `401 Invalid token`.
  - Mobile:
    1. Login.
    2. Trigger sign out.
    3. Confirm `POST /api/auth/logout` happens (proxy logs/inspector).
    4. Old token fails on `GET /api/auth/me`.

- Expected:
  - Logout endpoint is called first, then local session is cleared.
  - Even if logout call fails, local cleanup still happens.
- Screenshot evidence:
  - Network tab/proxy logs showing `POST /api/auth/logout`.
  - Follow-up `401 Invalid token` on old token.
