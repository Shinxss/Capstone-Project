# Module 12 Evidence Summary

- Run ID: `20260310-204022`
- Generated At: `2026-03-10T12:40:23.007Z`
- Node: `v22.19.0`
- Platform: `win32 x64`
- Git Commit: `9ce99f4c05e794c87bace9a146e1929688d1550d`

## Session 1 - Performance Test Pack

| Test Case | Steps (Short) | Expected Result | Actual Result | Pass/Fail | Notes |
|---|---|---|---|---|---|
| Flood Risk Categorization Latency (Module 11) | Run predictRoutingRiskCosts on 1 segment, repeat 5 runs | Risk output (routing_cost, risk_level) returns within 1.0 s per call | ERROR: Server harness failed: scripts/perf/server-routing-risk-benchmark.ts<br>Log: C:\Projects\Lifeline\tools\module12-evidence\results\20260310-204022\raw\logs\server-routing-risk-benchmark.log<br> | ERROR | Runner execution failed before metric extraction; see raw case evidence for stack/error details. |

## Session 2 - Security Test Pack

| Test Case | Steps (Short) | Expected Result | Actual Result | Pass/Fail | Notes |
|---|---|---|---|---|---|

