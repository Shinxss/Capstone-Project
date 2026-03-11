# Module 12 Evidence Harness

This folder contains reproducible evidence runners for Module 12 (Performance + Security) using live code paths in:
- `apps/server`
- `apps/blockchain`

The runners execute real measurements at runtime and generate:
- raw logs
- raw traces
- machine-readable summary JSON
- presentation-ready markdown tables

## Quick Run

From repo root:

```bash
pnpm test:all
pnpm test:performance
pnpm test:security
```

Default console output is compact:
- `[PASS/FAIL] <Test Title>`
- `Actual Result: <number-only>` or `Actual Result: PASS 1 / FAIL 0`

Verbose mode:

```bash
pnpm test:all --verbose
pnpm test:performance --verbose
pnpm test:security --verbose
pnpm test:case <case-id> --verbose
```

Single-case runner:

```bash
pnpm test:case <case-id>
```

## Output Location

Each run creates:

```text
tools/Added Features Testing/results/<timestamp>/
```

Files produced:
- `summary.md` - full report with required Module 12 table format
- `summary.json` - machine-readable results with mappings and evidence paths
- `presenter.md` - compact demo-friendly report
- `environment.json` - timestamp, platform, Node version, git commit/branch
- `raw/cases/*.json` - per-test evidence payload
- `raw/logs/*.log` - raw command/harness logs
- `raw/traces/*.json` - parsed benchmark traces
- `raw/artifacts/*` - generated evidence artifacts (CSV)

## What Each Script Proves

- `scripts/perf/server-routing-risk-benchmark.ts`
  - Flood risk latency
  - Speed guidance latency
  - CSV logging overhead
  - AI concurrency throughput
- `scripts/perf/server-routing-risk-cold-start.ts`
  - Cold-start route risk + guidance trace
- `scripts/sec/server-routing-risk-schema-security.ts`
  - Empty/oversized/script-type/strict-key validation rejections
- `scripts/sec/server-csv-sensitive-check.ts`
  - CSV sensitive field exposure check
- `scripts/sec/server-auth-rbac-limiter-security.ts`
  - Missing JWT, invalid JWT, RBAC, and rate-limit flood protection
- existing suites (invoked by runner):
  - `pnpm --dir apps/blockchain test`
  - `pnpm --dir apps/blockchain test:gas`
  - `pnpm --dir apps/server run test:dispatch-chain`

## Pass/Fail Rules

- PASS/FAIL are computed from measured runtime values or observed assertion outputs.
- PASS is never hardcoded.
- If a runner cannot execute (command error, parsing error, etc.), case is marked `ERROR`.
- Exit codes:
  - `0`: all cases PASS
  - `1`: one or more FAIL
  - `2`: one or more ERROR

## Presentation Guidance

For live demo, show:
1. terminal output from `pnpm test:all`
2. generated `presenter.md`
3. generated `summary.md`
4. selected raw logs/traces from the same timestamp folder

## Case Mapping Source

Case metadata and source mappings are in:

```text
tools/Added Features Testing/config/test-cases.json
```

Each case includes:
- `id`
- mapped source file(s)
- runner alias command
- runtime-generated raw evidence file path (written in summary outputs)

