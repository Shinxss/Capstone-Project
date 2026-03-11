# Module 12 Presenter Report

## Session 1 - Performance

| Test Case | Actual Result | Pass/Fail | Evidence |
|---|---|---|---|
| Flood Risk Categorization Latency (Module 11) | Median: 0.801 ms across 5 runs; cold-start first run: 1020.276 ms; risk_level returned | FAIL | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/perf_01_flood_risk_latency.json |
| Speed Guidance Generation Latency (Module 11) | Average: 6.049 ms across 5 runs; speed tiers observed: 15, 25, 35, 45 | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/perf_02_speed_guidance_latency.json |
| Structured CSV Logging Overhead (Module 11) | Off avg: 26.523 ms; On avg: 15.043 ms; Overhead: -43.28%; CSV header verified; 5,000 rows appended | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/perf_03_csv_overhead.json |
| Flood Risk + Speed Guidance Cold-Start Trace | Completed in 452.06 ms; outputs included LOW/45, HIGH/15 | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/perf_04_cold_start_trace.json |
| AI Routing Throughput Under Concurrency | 20 concurrent requests completed; total: 26.678 ms; average: 1.334 ms per request; failures: 0 | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/perf_05_ai_concurrency.json |
| Blockchain verifyTask Latency | Verifier can verifyTask completed in 1035 ms | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/perf_06_blockchain_verify_latency.json |
| Blockchain Revoke/Reverify Latency | Admin can revoke then reverify completed in 72 ms | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/perf_07_blockchain_reverify_latency.json |
| Blockchain Gas Budget (verifyTask) | Gas estimate: 49,275 (budget: 80,000) | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/perf_08_blockchain_gas_budget.json |
| Dispatch Chain Hashing Performance | Canonical hash: 13.7248 ms; proof-file hash: 0.3169 ms; deterministic-order hash prep: 2.8505 ms (3/3 pass) | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/perf_09_dispatch_chain_hashing.json |
| Blockchain verifyTask Gas Used Snapshot | Gas used: 49,287; delta vs estimate: 12 (0.02%) | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/perf_10_blockchain_gas_used.json |

## Session 2 - Security

| Test Case | Actual Result | Pass/Fail | Evidence |
|---|---|---|---|
| Flood Risk Endpoint Empty Input Rejection | Rejected with too_small: "Too small: expected array to have >=1 items" | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/sec_01_flood_empty.json |
| Flood Risk Oversized Payload Rejection | Rejected with too_big: "Too big: expected array to have <=1000 items" | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/sec_02_flood_oversized.json |
| Flood Risk Script-Injection Type Rejection | Rejected with invalid_type: "Invalid input: expected number, received string" at segments.0.flood_depth_5yr | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/sec_03_flood_script_type.json |
| Flood Risk Strict-Key Tamper Rejection | Rejected with unrecognized_keys for admin/debug fields | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/sec_04_flood_strict_keys.json |
| Structured CSV Log Sensitive-Field Exposure Check | Header contained routing/model/weather fields only; sensitive columns detected: none | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/sec_05_csv_sensitive_fields.json |
| Missing JWT Handling (requireAuth) | 401 with body {"message":"Unauthorized"} | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/sec_06_missing_jwt.json |
| Invalid JWT Handling (requireAuth) | 401 with body {"message":"Invalid token"} | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/sec_07_invalid_jwt.json |
| RBAC Enforcement on LGU-Only Middleware | No-role: 401; Volunteer: 403; LGU control: 200 | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/sec_08_rbac_enforcement.json |
| AI Endpoint Abuse / Flood Protection | 30 requests returned 200; 5 requests returned 429; first 429 at request #31; avg 3.446 ms/request | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/sec_09_ai_flood_protection.json |
| Unauthorized Blockchain Verify Attempt | Test passed: "Stranger cannot verifyTask (missing VERIFIER_ROLE)" (66 ms) | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/sec_10_unauth_blockchain_verify.json |
| Unauthorized Blockchain Admin Actions | Revoke/Reverify blocked (67 ms); GrantVerifier blocked | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/sec_11_unauth_blockchain_admin.json |
| Replay/Duplicate Blockchain Verification Attempt | Test passed: duplicate verification blocked (ALREADY_VERIFIED) | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/sec_12_replay_blockchain.json |
| Tamper Attempt on Unverified Record (Revoke/Reverify) | Test passed: "Cannot revoke/reverify a task that was never verified (NOT_VERIFIED)" | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-211659/raw/cases/sec_13_tamper_unverified_blockchain.json |
