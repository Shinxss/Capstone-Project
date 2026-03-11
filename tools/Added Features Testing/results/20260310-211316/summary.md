# Module 12 Evidence Summary

- Run ID: `20260310-211316`
- Generated At: `2026-03-10T13:13:17.048Z`
- Node: `v22.19.0`
- Platform: `win32 x64`
- Git Commit: `9ce99f4c05e794c87bace9a146e1929688d1550d`

## Session 1 - Performance Test Pack

| Test Case | Steps (Short) | Expected Result | Actual Result | Pass/Fail | Notes |
|---|---|---|---|---|---|


## Session 2 - Security Test Pack

| Test Case | Steps (Short) | Expected Result | Actual Result | Pass/Fail | Notes |
|---|---|---|---|---|---|
| Flood Risk Endpoint Empty Input Rejection | Validate routingRiskPredictSchema with segments: [] | Request is rejected for empty segments (minimum 1) | Rejected with too_small: "Too small: expected array to have >=1 items" | PASS | Validated routingRiskPredictSchema in a server TSX harness using safeParse; source is direct schema issue output; single execution. |
| Flood Risk Oversized Payload Rejection | Validate schema with 1,001 segments | Request is rejected for exceeding max segment count (1000) | Rejected with too_big: "Too big: expected array to have <=1000 items" | PASS | Validated 1,001-segment payload with routingRiskPredictSchema.safeParse in TSX harness; measured through returned Zod issue list; 1 run. |
| Flood Risk Script-Injection Type Rejection | Submit string payload in numeric field (flood_depth_5yr) | Non-numeric/script-like input is rejected | Rejected with invalid_type: "Invalid input: expected number, received string" at segments.0.flood_depth_5yr | PASS | Tested script-like string in numeric field via routingRiskPredictSchema.safeParse in TSX harness; evidence from issue path and code; 1 run. |
| Flood Risk Strict-Key Tamper Rejection | Submit extra keys (admin, debug) to strict schemas | Unexpected keys are blocked | Rejected with unrecognized_keys for admin/debug fields | PASS | Submitted unexpected keys to strict routing-risk schemas in TSX harness; evaluated Zod unrecognized_keys output; single run. |
| Structured CSV Log Sensitive-Field Exposure Check | Inspect generated routing-risk CSV header and first data row | Logs exclude secrets (no token/JWT/password/private key fields) | Header contained routing/model/weather fields only; sensitive columns detected: none | PASS | Generated a fresh routing-risk CSV via TSX harness, then inspected header and first row using regex checks for token/JWT/password/secret fields; 1 run. |
| Missing JWT Handling (requireAuth) | Call protected route without Authorization header | Middleware returns 401 Unauthorized | 401 with body {"message":"Unauthorized"} | PASS | Executed local Express harness importing requireAuth; called protected route without Authorization header via fetch; captured HTTP status/body; 1 run. |
| Invalid JWT Handling (requireAuth) | Call protected route with malformed bearer token | Middleware returns 401 Invalid token | 401 with body {"message":"Invalid token"} | PASS | Executed same Express harness with malformed bearer token against requireAuth route; measured response status/body from fetch; 1 run. |
| RBAC Enforcement on LGU-Only Middleware | Hit role-guarded route as no-role and VOLUNTEER (control: LGU) | No-role gets 401, disallowed role gets 403, allowed role gets 200 | No-role: 401; Volunteer: 403; LGU control: 200 | PASS | Measured with local Express middleware harness importing requireRole('LGU','ADMIN'); sent three role scenarios via fetch; one run per role. |
| AI Endpoint Abuse / Flood Protection | Send 35 rapid POSTs through routingOptimizeLimiter | First 30 pass, excess requests are rate-limited with 429 | 30 requests returned 200; 5 requests returned 429; first 429 at request #31; avg 4.31 ms/request | PASS | Measured via local Express harness with routingOptimizeLimiter middleware; fired 35 sequential POST requests and counted status codes using fetch; timing from performance.now(). |
| Unauthorized Blockchain Verify Attempt | Run security suite case for non-verifier calling verifyTask | Unauthorized account is blocked by access control | Test passed: "Stranger cannot verifyTask (missing VERIFIER_ROLE)" (45 ms) | PASS | Verified from Hardhat security suite output and assertion coverage in apps/blockchain/test/SecurityCases.test.ts; command: pnpm --dir apps/blockchain test; 1 suite run. |
| Unauthorized Blockchain Admin Actions | Run non-admin revoke/reverify and grant-verifier attempts | Unauthorized admin-level actions are blocked | Revoke/Reverify blocked (43 ms); GrantVerifier blocked | PASS | Measured from the HK unauthorized-admin cases in SecurityCases.test.ts output; source command: pnpm --dir apps/blockchain test; 1 suite run. |
| Replay/Duplicate Blockchain Verification Attempt | Attempt second verifyTask on same task hash | Replay is rejected with ALREADY_VERIFIED | Test passed: duplicate verification blocked (ALREADY_VERIFIED) | PASS | Verified replay-protection assertion from SecurityCases.test.ts and Hardhat test output for ALREADY_VERIFIED condition; one suite run. |
| Tamper Attempt on Unverified Record (Revoke/Reverify) | Attempt revoke/reverify for task never verified | Contract rejects tamper path with NOT_VERIFIED | Test passed: "Cannot revoke/reverify a task that was never verified (NOT_VERIFIED)" | PASS | Verified tamper-path rejection by matching NOT_VERIFIED test assertion and runtime output in blockchain security suite; 1 suite run. |
