# Module 12 Presenter Report

## Session 1 - Performance

| Test Case | Actual Result | Pass/Fail | Evidence |
|---|---|---|---|


## Session 2 - Security

| Test Case | Actual Result | Pass/Fail | Evidence |
|---|---|---|---|
| Flood Risk Endpoint Empty Input Rejection | ERROR: Server harness failed: scripts/sec/server-routing-risk-schema-security.ts
Log: C:\Projects\Lifeline\tools\Added Features Testing\results\20260310-222452\raw\logs\server-routing-risk-schema-security.log
node:internal/modules/run_main:123
    triggerUncaughtException(
    ^
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'C:\Projects\Lifeline\tools\Added' imported from C:\Projects\Lifeline\apps\server\
    at finalizeResolution (node:internal/modules/esm/resolve:274:11)
    at moduleResolve (node:internal/modules/esm/resolve:859:10)
    at defaultResolve (node:internal/modules/esm/resolve:983:11)
    at nextResolve (node:internal/modules/esm/hooks:748:28)
    at resolveBase (file:///C:/Projects/Lifeline/node_modules/tsx/dist/esm/index.mjs?1773152694021:2:3744)
    at resolveDirectory (file:///C:/Projects/Lifeline/node_modules/tsx/dist/esm/index.mjs?1773152694021:2:4243)
    at resolveTsPaths (file:///C:/Projects/Lifeline/node_modules/tsx/dist/esm/index.mjs?1773152694021:2:4984)
    at resolve (file:///C:/Projects/Lifeline/node_modules/tsx/dist/esm/index.mjs?1773152694021:2:5361)
    at nextResolve (node:internal/modules/esm/hooks:748:28)
    at Hooks.resolve (node:internal/modules/esm/hooks:240:30) {
  code: 'ERR_MODULE_NOT_FOUND',
  url: 'file:///C:/Projects/Lifeline/tools/Added'
}

Node.js v22.19.0 | ERROR | C:/Projects/Lifeline/tools/Added Features Testing/results/20260310-222452/raw/cases/sec_01_flood_empty.json |
