# Module 12 Presenter Report

## Session 1 - Performance

| Test Case | Actual Result | Pass/Fail | Evidence |
|---|---|---|---|
| Flood Risk Categorization Latency (Module 11) | Median: 0.398 ms across 5 runs; cold-start first run: 970.47 ms; risk_level returned | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-204115/raw/cases/perf_01_flood_risk_latency.json |
| Speed Guidance Generation Latency (Module 11) | Average: 4.872 ms across 5 runs; speed tiers observed: 15, 25, 35, 45 | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-204115/raw/cases/perf_02_speed_guidance_latency.json |
| Structured CSV Logging Overhead (Module 11) | Off avg: 4.442 ms; On avg: 11.116 ms; Overhead: 150.26%; CSV header verified; 5,000 rows appended | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-204115/raw/cases/perf_03_csv_overhead.json |
| Flood Risk + Speed Guidance Cold-Start Trace | Completed in 689.937 ms; outputs included LOW/45, HIGH/15 | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-204115/raw/cases/perf_04_cold_start_trace.json |
| AI Routing Throughput Under Concurrency | 20 concurrent requests completed; total: 8.472 ms; average: 0.424 ms per request; failures: 0 | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-204115/raw/cases/perf_05_ai_concurrency.json |
| Blockchain verifyTask Latency | Verifier can verifyTask completed in 1368 ms | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-204115/raw/cases/perf_06_blockchain_verify_latency.json |
| Blockchain Revoke/Reverify Latency | Admin can revoke then reverify completed in 239 ms | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-204115/raw/cases/perf_07_blockchain_reverify_latency.json |
| Blockchain Gas Budget (verifyTask) | Gas estimate: 49,275 (budget: 80,000) | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-204115/raw/cases/perf_08_blockchain_gas_budget.json |
| Dispatch Chain Hashing Performance | Canonical hash: 20.8457 ms; proof-file hash: 0.6733 ms; deterministic-order hash prep: 7.5068 ms (3/3 pass) | FAIL | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-204115/raw/cases/perf_09_dispatch_chain_hashing.json |
| Blockchain verifyTask Gas Used Snapshot | Gas used: 49,287; delta vs estimate: 12 (0.02%) | PASS | C:/Projects/Lifeline/tools/module12-evidence/results/20260310-204115/raw/cases/perf_10_blockchain_gas_used.json |

## Session 2 - Security

| Test Case | Actual Result | Pass/Fail | Evidence |
|---|---|---|---|

