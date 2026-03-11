# Module 12 Presenter Report

## Session 1 - Performance

| Test Case | Actual Result | Pass/Fail | Evidence |
|---|---|---|---|


## Session 2 - Security

| Test Case | Actual Result | Pass/Fail | Evidence |
|---|---|---|---|
| Flood Risk Endpoint Empty Input Rejection | Rejected with too_small: "Too small: expected array to have >=1 items" | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211316/raw/cases/sec_01_flood_empty.json |
| Flood Risk Oversized Payload Rejection | Rejected with too_big: "Too big: expected array to have <=1000 items" | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211316/raw/cases/sec_02_flood_oversized.json |
| Flood Risk Script-Injection Type Rejection | Rejected with invalid_type: "Invalid input: expected number, received string" at segments.0.flood_depth_5yr | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211316/raw/cases/sec_03_flood_script_type.json |
| Flood Risk Strict-Key Tamper Rejection | Rejected with unrecognized_keys for admin/debug fields | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211316/raw/cases/sec_04_flood_strict_keys.json |
| Structured CSV Log Sensitive-Field Exposure Check | Header contained routing/model/weather fields only; sensitive columns detected: none | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211316/raw/cases/sec_05_csv_sensitive_fields.json |
| Missing JWT Handling (requireAuth) | 401 with body {"message":"Unauthorized"} | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211316/raw/cases/sec_06_missing_jwt.json |
| Invalid JWT Handling (requireAuth) | 401 with body {"message":"Invalid token"} | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211316/raw/cases/sec_07_invalid_jwt.json |
| RBAC Enforcement on LGU-Only Middleware | No-role: 401; Volunteer: 403; LGU control: 200 | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211316/raw/cases/sec_08_rbac_enforcement.json |
| AI Endpoint Abuse / Flood Protection | 30 requests returned 200; 5 requests returned 429; first 429 at request #31; avg 4.31 ms/request | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211316/raw/cases/sec_09_ai_flood_protection.json |
| Unauthorized Blockchain Verify Attempt | Test passed: "Stranger cannot verifyTask (missing VERIFIER_ROLE)" (45 ms) | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211316/raw/cases/sec_10_unauth_blockchain_verify.json |
| Unauthorized Blockchain Admin Actions | Revoke/Reverify blocked (43 ms); GrantVerifier blocked | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211316/raw/cases/sec_11_unauth_blockchain_admin.json |
| Replay/Duplicate Blockchain Verification Attempt | Test passed: duplicate verification blocked (ALREADY_VERIFIED) | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211316/raw/cases/sec_12_replay_blockchain.json |
| Tamper Attempt on Unverified Record (Revoke/Reverify) | Test passed: "Cannot revoke/reverify a task that was never verified (NOT_VERIFIED)" | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211316/raw/cases/sec_13_tamper_unverified_blockchain.json |
