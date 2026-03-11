# Module 12 Evidence Summary

- Run ID: `20260310-222452`
- Generated At: `2026-03-10T14:24:52.913Z`
- Node: `v22.19.0`
- Platform: `win32 x64`
- Git Commit: `9ce99f4c05e794c87bace9a146e1929688d1550d`

## Session 1 - Performance Test Pack

| Test Case | Steps (Short) | Expected Result | Actual Result | Pass/Fail | Notes |
|---|---|---|---|---|---|


## Session 2 - Security Test Pack

| Test Case | Steps (Short) | Expected Result | Actual Result | Pass/Fail | Notes |
|---|---|---|---|---|---|
| Flood Risk Endpoint Empty Input Rejection | Validate routingRiskPredictSchema with segments: [] | Request is rejected for empty segments (minimum 1) | ERROR: Server harness failed: scripts/sec/server-routing-risk-schema-security.ts<br>Log: C:\Projects\Lifeline\tools\Added Features Testing\results\20260310-222452\raw\logs\server-routing-risk-schema-security.log<br>node:internal/modules/run_main:123<br>    triggerUncaughtException(<br>    ^<br>Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'C:\Projects\Lifeline\tools\Added' imported from C:\Projects\Lifeline\apps\server\<br>    at finalizeResolution (node:internal/modules/esm/resolve:274:11)<br>    at moduleResolve (node:internal/modules/esm/resolve:859:10)<br>    at defaultResolve (node:internal/modules/esm/resolve:983:11)<br>    at nextResolve (node:internal/modules/esm/hooks:748:28)<br>    at resolveBase (file:///C:/Projects/Lifeline/node_modules/tsx/dist/esm/index.mjs?1773152694021:2:3744)<br>    at resolveDirectory (file:///C:/Projects/Lifeline/node_modules/tsx/dist/esm/index.mjs?1773152694021:2:4243)<br>    at resolveTsPaths (file:///C:/Projects/Lifeline/node_modules/tsx/dist/esm/index.mjs?1773152694021:2:4984)<br>    at resolve (file:///C:/Projects/Lifeline/node_modules/tsx/dist/esm/index.mjs?1773152694021:2:5361)<br>    at nextResolve (node:internal/modules/esm/hooks:748:28)<br>    at Hooks.resolve (node:internal/modules/esm/hooks:240:30) {<br>  code: 'ERR_MODULE_NOT_FOUND',<br>  url: 'file:///C:/Projects/Lifeline/tools/Added'<br>}<br><br>Node.js v22.19.0 | ERROR | Runner execution failed before metric extraction; see raw case evidence for stack/error details. |
