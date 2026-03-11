# Module 12 Evidence Summary

- Run ID: `20260310-204115`
- Generated At: `2026-03-10T12:41:15.898Z`
- Node: `v22.19.0`
- Platform: `win32 x64`
- Git Commit: `9ce99f4c05e794c87bace9a146e1929688d1550d`

## Session 1 - Performance Test Pack

| Test Case | Steps (Short) | Expected Result | Actual Result | Pass/Fail | Notes |
|---|---|---|---|---|---|
| Flood Risk Categorization Latency (Module 11) | Run predictRoutingRiskCosts on 1 segment, repeat 5 runs | Risk output (routing_cost, risk_level) returns within 1.0 s per call | Median: 0.398 ms across 5 runs; cold-start first run: 970.47 ms; risk_level returned | PASS | Measured with performance.now() in TSX harness under apps/server; executed 5 single-segment runs; source: raw benchmark JSON trace and harness log. |
| Speed Guidance Generation Latency (Module 11) | Run 1,000-segment prediction batch, repeat 5 runs | recommended_speed_kph generated for all segments with average latency < 10 ms | Average: 4.872 ms across 5 runs; speed tiers observed: 15, 25, 35, 45 | PASS | Measured with performance.now() in the same server TSX benchmark on 1,000 segments; 5 repeated runs; speed tiers read from prediction output set. |
| Structured CSV Logging Overhead (Module 11) | Compare prediction runtime with LOG_ROUTING_RISK=0 vs LOG_ROUTING_RISK=1 | CSV rows append with required fields and logging overhead stays below 3x baseline | Off avg: 4.442 ms; On avg: 11.116 ms; Overhead: 150.26%; CSV header verified; 5,000 rows appended | PASS | Measured by toggling LOG_ROUTING_RISK in the TSX benchmark (5 runs each mode); durations from performance.now(); CSV evidence read from generated artifact file. |
| Flood Risk + Speed Guidance Cold-Start Trace | Run one 2-segment prediction request | First-call inference returns risk + guidance within 1.0 s | Completed in 689.937 ms; outputs included LOW/45, HIGH/15 | PASS | Measured in a fresh TSX harness process calling predictRoutingRiskCosts once with two segments; elapsed time from performance.now(); single cold-start run. |
| AI Routing Throughput Under Concurrency | Execute 20 concurrent prediction calls (100 segments each) | All concurrent requests complete with no failed responses | 20 concurrent requests completed; total: 8.472 ms; average: 0.424 ms per request; failures: 0 | PASS | Measured with Promise.all in server TSX benchmark; each request contained 100 segments; one 20-request concurrency run; timing source: performance.now(). |
| Blockchain verifyTask Latency | Run blockchain test suite and capture verify scenario timing | Local-chain verification flow completes within 2.0 s | Verifier can verifyTask completed in 1368 ms | PASS | Measured from Hardhat test output in apps/blockchain (`pnpm --dir apps/blockchain test`); verify scenario timing captured from reporter output; 1 suite run. |
| Blockchain Revoke/Reverify Latency | Run admin correction flow in security suite | Revoke + reverify flow completes within 500 ms | Admin can revoke then reverify completed in 239 ms | PASS | Measured from the same Hardhat suite output; revoke/reverify case timing parsed from test reporter line; single observed run. |
| Blockchain Gas Budget (verifyTask) | Run gas snapshot test | estimateGas remains within configured budget (<= 80,000) | Gas estimate: 49,275 (budget: 80,000) | PASS | Taken from Hardhat gas snapshot output (`pnpm --dir apps/blockchain test:gas`); source line `[gas] verifyTask estimateGas=... budget=...`; 1 run. |
| Dispatch Chain Hashing Performance | Run dispatch-chain tests in server | Hashing subtests pass and each hash operation remains < 15 ms | Canonical hash: 20.8457 ms; proof-file hash: 0.6733 ms; deterministic-order hash prep: 7.5068 ms (3/3 pass) | FAIL | Measured from TAP duration_ms in apps/server dispatch-chain test (`pnpm --dir apps/server run test:dispatch-chain`); one full run. |
| Blockchain verifyTask Gas Used Snapshot | Run full blockchain suite and capture runtime gasUsed log | gasUsed remains below 80,000 and close to estimate | Gas used: 49,287; delta vs estimate: 12 (0.02%) | PASS | Gas used captured from full Hardhat suite output; compared against estimateGas from gas snapshot test; sources: blockchain test logs; one run each command. |

## Session 2 - Security Test Pack

| Test Case | Steps (Short) | Expected Result | Actual Result | Pass/Fail | Notes |
|---|---|---|---|---|---|

