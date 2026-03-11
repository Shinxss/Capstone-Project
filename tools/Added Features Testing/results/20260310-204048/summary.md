# Module 12 Evidence Summary

- Run ID: `20260310-204048`
- Generated At: `2026-03-10T12:40:48.717Z`
- Node: `v22.19.0`
- Platform: `win32 x64`
- Git Commit: `9ce99f4c05e794c87bace9a146e1929688d1550d`

## Session 1 - Performance Test Pack

| Test Case | Steps (Short) | Expected Result | Actual Result | Pass/Fail | Notes |
|---|---|---|---|---|---|
| Flood Risk Categorization Latency (Module 11) | Run predictRoutingRiskCosts on 1 segment, repeat 5 runs | Risk output (routing_cost, risk_level) returns within 1.0 s per call | Median: 0.538 ms across 5 runs; cold-start first run: 1079.243 ms; risk_level returned | PASS | Measured with performance.now() in TSX harness under apps/server; executed 5 single-segment runs; source: raw benchmark JSON trace and harness log. |

## Session 2 - Security Test Pack

| Test Case | Steps (Short) | Expected Result | Actual Result | Pass/Fail | Notes |
|---|---|---|---|---|---|

