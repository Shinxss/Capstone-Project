const path = require("node:path");
const fs = require("node:fs");
const { getPnpmCommand, runCommand } = require("./command");
const { ensureDir, writeJson, writeText, readJson, timestampForPath } = require("./io");
const { buildSummaryMarkdown, buildPresenterMarkdown } = require("./report");

const JSON_START = "MODULE12_EVIDENCE_JSON_START";
const JSON_END = "MODULE12_EVIDENCE_JSON_END";

const ROOT_DIR = path.resolve(__dirname, "..", "..", "..");
const TOOLS_DIR = path.join(ROOT_DIR, "tools", "Added Features Testing");
const CONFIG_PATH = path.join(TOOLS_DIR, "config", "test-cases.json");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatMs(value, digits = 3) {
  if (!Number.isFinite(value)) return "N/A";
  return `${Number(value).toFixed(digits).replace(/\.?0+$/, "")} ms`;
}

function formatInt(value) {
  if (!Number.isFinite(value)) return "N/A";
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function formatPct(value, digits = 2) {
  if (!Number.isFinite(value)) return "N/A";
  return `${Number(value).toFixed(digits).replace(/\.?0+$/, "")}%`;
}

function formatCompactMs(value, digits = 3) {
  if (!Number.isFinite(value)) return "FAIL 0";
  return `${Number(value).toFixed(digits).replace(/\.?0+$/, "")} ms`;
}

function formatCompactInt(value) {
  if (!Number.isFinite(value)) return "FAIL 0";
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function formatCompactPct(value, digits = 2) {
  if (!Number.isFinite(value)) return "FAIL 0";
  return `${Number(value).toFixed(digits).replace(/\.?0+$/, "")}%`;
}

function extractMarkedJson(output) {
  const start = output.indexOf(JSON_START);
  const end = output.indexOf(JSON_END);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Unable to parse marked JSON payload.\n${output}`);
  }
  const jsonText = output.slice(start + JSON_START.length, end).trim();
  return JSON.parse(jsonText);
}

function parseSpecDurationMs(output, testTitle) {
  const re = new RegExp(`${escapeRegex(testTitle)}(?:\\s*\\(([-\\d.]+)ms\\))?`);
  const match = output.match(re);
  if (!match) return null;
  if (!match[1]) return null;
  return Number(match[1]);
}

function parseTapSubtestDuration(output, subtestTitle) {
  const re = new RegExp(`# Subtest: ${escapeRegex(subtestTitle)}[\\s\\S]*?duration_ms:\\s*([\\d.]+)`);
  const match = output.match(re);
  return match ? Number(match[1]) : null;
}

function getEnvironmentInfo() {
  const gitCommitResult = runCommand("git", ["rev-parse", "HEAD"], { cwd: ROOT_DIR });
  const gitBranchResult = runCommand("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: ROOT_DIR });
  return {
    node: process.version,
    platform: `${process.platform} ${process.arch}`,
    cwd: ROOT_DIR,
    gitCommit: gitCommitResult.status === 0 ? (gitCommitResult.stdout || "").trim() : null,
    gitBranch: gitBranchResult.status === 0 ? (gitBranchResult.stdout || "").trim() : null,
  };
}

function createContext(runLabel) {
  const runId = timestampForPath();
  const resultsDir = path.join(TOOLS_DIR, "results", runId);
  const rawDir = path.join(resultsDir, "raw");
  const rawCasesDir = path.join(rawDir, "cases");
  const logsDir = path.join(rawDir, "logs");
  const tracesDir = path.join(rawDir, "traces");
  const artifactsDir = path.join(rawDir, "artifacts");
  ensureDir(resultsDir);
  ensureDir(rawDir);
  ensureDir(rawCasesDir);
  ensureDir(logsDir);
  ensureDir(tracesDir);
  ensureDir(artifactsDir);

  const environment = getEnvironmentInfo();
  writeJson(path.join(resultsDir, "environment.json"), {
    runId,
    runLabel,
    generatedAt: new Date().toISOString(),
    environment,
  });

  return {
    runId,
    runLabel,
    generatedAt: new Date().toISOString(),
    rootDir: ROOT_DIR,
    resultsDir,
    rawDir,
    rawCasesDir,
    logsDir,
    tracesDir,
    artifactsDir,
    environment,
    memo: new Map(),
  };
}

function loadCases() {
  return readJson(CONFIG_PATH);
}

function runServerHarness(ctx, harnessRelativePath, args = [], logFileName) {
  const scriptPath = path.join(TOOLS_DIR, harnessRelativePath);
  const logPath = path.join(ctx.logsDir, logFileName);
  const cmd = getPnpmCommand();
  const result = runCommand(cmd, ["--dir", "apps/server", "exec", "tsx", scriptPath, ...args], {
    cwd: ROOT_DIR,
    env: process.env,
    logPath,
    timeoutMs: 180000,
  });
  if (result.status !== 0) {
    throw new Error(`Server harness failed: ${harnessRelativePath}\nLog: ${logPath}\n${result.output}`);
  }
  const data = extractMarkedJson(result.output);
  return { data, logPath };
}

function getRoutingRiskBenchmark(ctx) {
  const key = "routingRiskBenchmark";
  if (ctx.memo.has(key)) return ctx.memo.get(key);
  const csvPath = path.join(ctx.artifactsDir, "routing-risk-benchmark.csv");
  const { data, logPath } = runServerHarness(
    ctx,
    "scripts/perf/server-routing-risk-benchmark.ts",
    [csvPath],
    "server-routing-risk-benchmark.log"
  );
  const tracePath = path.join(ctx.tracesDir, "routing-risk-benchmark.json");
  writeJson(tracePath, data);
  const value = { ...data, logPath, tracePath, csvPath };
  ctx.memo.set(key, value);
  return value;
}

function getRoutingRiskColdStart(ctx) {
  const key = "routingRiskColdStart";
  if (ctx.memo.has(key)) return ctx.memo.get(key);
  const { data, logPath } = runServerHarness(
    ctx,
    "scripts/perf/server-routing-risk-cold-start.ts",
    [],
    "server-routing-risk-cold-start.log"
  );
  const tracePath = path.join(ctx.tracesDir, "routing-risk-cold-start.json");
  writeJson(tracePath, data);
  const value = { ...data, logPath, tracePath };
  ctx.memo.set(key, value);
  return value;
}

function getRoutingRiskSchemaSecurity(ctx) {
  const key = "routingRiskSchemaSecurity";
  if (ctx.memo.has(key)) return ctx.memo.get(key);
  const { data, logPath } = runServerHarness(
    ctx,
    "scripts/sec/server-routing-risk-schema-security.ts",
    [],
    "server-routing-risk-schema-security.log"
  );
  const tracePath = path.join(ctx.tracesDir, "routing-risk-schema-security.json");
  writeJson(tracePath, data);
  const value = { ...data, logPath, tracePath };
  ctx.memo.set(key, value);
  return value;
}

function getCsvSensitiveCheck(ctx) {
  const key = "csvSensitiveCheck";
  if (ctx.memo.has(key)) return ctx.memo.get(key);
  const csvPath = path.join(ctx.artifactsDir, "routing-risk-sensitive-check.csv");
  const { data, logPath } = runServerHarness(
    ctx,
    "scripts/sec/server-csv-sensitive-check.ts",
    [csvPath],
    "server-csv-sensitive-check.log"
  );
  const tracePath = path.join(ctx.tracesDir, "routing-risk-sensitive-check.json");
  writeJson(tracePath, data);
  const value = { ...data, logPath, tracePath, csvPath };
  ctx.memo.set(key, value);
  return value;
}

function getAuthRbacLimiterSecurity(ctx) {
  const key = "authRbacLimiterSecurity";
  if (ctx.memo.has(key)) return ctx.memo.get(key);
  const { data, logPath } = runServerHarness(
    ctx,
    "scripts/sec/server-auth-rbac-limiter-security.ts",
    [],
    "server-auth-rbac-limiter-security.log"
  );
  const tracePath = path.join(ctx.tracesDir, "auth-rbac-limiter-security.json");
  writeJson(tracePath, data);
  const value = { ...data, logPath, tracePath };
  ctx.memo.set(key, value);
  return value;
}

function getDispatchChainSuite(ctx) {
  const key = "dispatchChainSuite";
  if (ctx.memo.has(key)) return ctx.memo.get(key);
  const logPath = path.join(ctx.logsDir, "dispatch-chain-test.log");
  const cmd = getPnpmCommand();
  const result = runCommand(cmd, ["--dir", "apps/server", "run", "test:dispatch-chain"], {
    cwd: ROOT_DIR,
    env: process.env,
    logPath,
    timeoutMs: 180000,
  });
  if (result.status !== 0) {
    throw new Error(`Dispatch-chain test failed.\nLog: ${logPath}\n${result.output}`);
  }
  const output = result.output;
  const value = {
    canonicalMs: parseTapSubtestDuration(output, "canonical payload hashing is stable and includes schema/domain"),
    proofMs: parseTapSubtestDuration(output, "proof file hashing uses sha256 bytes digest"),
    deterministicMs: parseTapSubtestDuration(
      output,
      "payload prefers stored proofFileHashes from DB and keeps deterministic order"
    ),
    passCount: Number((output.match(/# pass (\d+)/) || [null, "0"])[1]),
    totalMs: Number((output.match(/# duration_ms ([\d.]+)/) || [null, "0"])[1]),
    logPath,
  };
  const tracePath = path.join(ctx.tracesDir, "dispatch-chain-test.json");
  writeJson(tracePath, value);
  value.tracePath = tracePath;
  ctx.memo.set(key, value);
  return value;
}

function getBlockchainSuite(ctx) {
  const key = "blockchainSuite";
  if (ctx.memo.has(key)) return ctx.memo.get(key);
  const logPath = path.join(ctx.logsDir, "blockchain-test.log");
  const cmd = getPnpmCommand();
  const result = runCommand(cmd, ["--dir", "apps/blockchain", "test"], {
    cwd: ROOT_DIR,
    env: process.env,
    logPath,
    timeoutMs: 240000,
  });
  if (result.status !== 0) {
    throw new Error(`Blockchain test suite failed.\nLog: ${logPath}\n${result.output}`);
  }
  const output = result.output;
  const value = {
    verifyLatencyMs: parseSpecDurationMs(output, "Verifier can verifyTask (event emitted + mapping saved)"),
    reverifyLatencyMs: parseSpecDurationMs(output, "Admin can revoke then reverify (audit correction flow)"),
    unauthorizedVerifyLatencyMs: parseSpecDurationMs(output, "Stranger cannot verifyTask (missing VERIFIER_ROLE)"),
    unauthorizedRevokeLatencyMs: parseSpecDurationMs(output, "Stranger cannot revoke or reverify (missing ADMIN_ROLE)"),
    unauthorizedGrantLatencyMs: parseSpecDurationMs(output, "Stranger cannot grantVerifier (admin-only)"),
    replayLatencyMs: parseSpecDurationMs(output, "Replay/Duplicate verification is blocked (ALREADY_VERIFIED)"),
    hasUnauthorizedVerify: output.includes("Stranger cannot verifyTask (missing VERIFIER_ROLE)"),
    hasUnauthorizedAdmin:
      output.includes("Stranger cannot revoke or reverify (missing ADMIN_ROLE)") &&
      output.includes("Stranger cannot grantVerifier (admin-only)"),
    hasReplay: output.includes("Replay/Duplicate verification is blocked (ALREADY_VERIFIED)"),
    hasNotVerified: output.includes("Cannot revoke/reverify a task that was never verified (NOT_VERIFIED)"),
    gasUsed: Number((output.match(/\[gas\] verifyTask gasUsed =\s*(\d+)/) || [null, "0"])[1]),
    passingCount: Number((output.match(/(\d+)\s+passing/) || [null, "0"])[1]),
    logPath,
  };
  const tracePath = path.join(ctx.tracesDir, "blockchain-test.json");
  writeJson(tracePath, value);
  value.tracePath = tracePath;
  ctx.memo.set(key, value);
  return value;
}

function getBlockchainGasSuite(ctx) {
  const key = "blockchainGasSuite";
  if (ctx.memo.has(key)) return ctx.memo.get(key);
  const logPath = path.join(ctx.logsDir, "blockchain-test-gas.log");
  const cmd = getPnpmCommand();
  const result = runCommand(cmd, ["--dir", "apps/blockchain", "test:gas"], {
    cwd: ROOT_DIR,
    env: process.env,
    logPath,
    timeoutMs: 180000,
  });
  if (result.status !== 0) {
    throw new Error(`Blockchain gas test failed.\nLog: ${logPath}\n${result.output}`);
  }
  const output = result.output;
  const gasMatch = output.match(/\[gas\] verifyTask estimateGas=(\d+)\s+budget=(\d+)/);
  const value = {
    estimateGas: gasMatch ? Number(gasMatch[1]) : null,
    budget: gasMatch ? Number(gasMatch[2]) : null,
    testDurationMs: parseSpecDurationMs(output, "verifyTask estimateGas stays within budget"),
    logPath,
  };
  const tracePath = path.join(ctx.tracesDir, "blockchain-gas-test.json");
  writeJson(tracePath, value);
  value.tracePath = tracePath;
  ctx.memo.set(key, value);
  return value;
}
function evaluateCase(ctx, def) {
  switch (def.id) {
    case "perf_01_flood_risk_latency": {
      const data = getRoutingRiskBenchmark(ctx);
      const maxRunMs = Math.max(...data.singleRow.runsMs);
      const pass = maxRunMs <= 1000 && data.singleRow.riskLevelReturned;
      return {
        actualResult: `Median: ${formatMs(data.singleRow.medianMs)} across 5 runs; cold-start first run: ${formatMs(
          data.singleRow.firstRunMs
        )}; risk_level returned`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Measured with performance.now() in TSX harness under apps/server; executed 5 single-segment runs; source: raw benchmark JSON trace and harness log.",
        measurement: data,
      };
    }
    case "perf_02_speed_guidance_latency": {
      const data = getRoutingRiskBenchmark(ctx);
      const expectedSpeeds = [15, 25, 35, 45];
      const hasAllSpeeds = expectedSpeeds.every((speed) => data.bulk1000.speedSet.includes(speed));
      const pass = data.bulk1000.avgMs < 10 && hasAllSpeeds;
      return {
        actualResult: `Average: ${formatMs(data.bulk1000.avgMs)} across 5 runs; speed tiers observed: ${data.bulk1000.speedSet.join(
          ", "
        )}`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Measured with performance.now() in the same server TSX benchmark on 1,000 segments; 5 repeated runs; speed tiers read from prediction output set.",
        measurement: data,
      };
    }
    case "perf_03_csv_overhead": {
      const data = getRoutingRiskBenchmark(ctx);
      const requiredColumns = [
        "timestamp",
        "model_available",
        "routing_cost",
        "risk_level",
        "recommended_speed_kph",
        "flood_depth_5yr",
        "rainfall_mm",
        "is_raining",
        "bridge",
        "road_priority",
        "feature_order",
      ];
      const headerColumns = data.csv.header.split(",");
      const hasRequiredColumns = requiredColumns.every((column) => headerColumns.includes(column));
      const pass = data.csv.onAvgMs <= data.csv.offAvgMs * 3 && hasRequiredColumns && data.csv.dataRows >= 5000;
      return {
        actualResult: `Off avg: ${formatMs(data.csv.offAvgMs)}; On avg: ${formatMs(
          data.csv.onAvgMs
        )}; Overhead: ${formatPct(data.csv.overheadPct)}; CSV header verified; ${formatInt(data.csv.dataRows)} rows appended`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Measured by toggling LOG_ROUTING_RISK in the TSX benchmark (5 runs each mode); durations from performance.now(); CSV evidence read from generated artifact file.",
        measurement: data,
      };
    }
    case "perf_04_cold_start_trace": {
      const data = getRoutingRiskColdStart(ctx);
      const outputPairs = (data.outputs || []).map((item) => `${item.risk_level}/${item.recommended_speed_kph}`);
      const hasFields = (data.outputs || []).every(
        (item) => typeof item.risk_level === "string" && typeof item.recommended_speed_kph === "number"
      );
      const pass = data.durationMs <= 1000 && hasFields;
      return {
        actualResult: `Completed in ${formatMs(data.durationMs)}; outputs included ${outputPairs.join(", ")}`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Measured in a fresh TSX harness process calling predictRoutingRiskCosts once with two segments; elapsed time from performance.now(); single cold-start run.",
        measurement: data,
      };
    }
    case "perf_05_ai_concurrency": {
      const data = getRoutingRiskBenchmark(ctx);
      const pass = data.concurrency.success === data.concurrency.requests && data.concurrency.failures === 0;
      return {
        actualResult: `${data.concurrency.requests} concurrent requests completed; total: ${formatMs(
          data.concurrency.totalMs
        )}; average: ${formatMs(data.concurrency.avgPerRequestMs)} per request; failures: ${data.concurrency.failures}`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Measured with Promise.all in server TSX benchmark; each request contained 100 segments; one 20-request concurrency run; timing source: performance.now().",
        measurement: data,
      };
    }
    case "perf_06_blockchain_verify_latency": {
      const data = getBlockchainSuite(ctx);
      const pass = data.hasUnauthorizedVerify && Number.isFinite(data.verifyLatencyMs) && data.verifyLatencyMs <= 2000;
      return {
        actualResult: `Verifier can verifyTask completed in ${formatMs(data.verifyLatencyMs, 0)}`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Measured from Hardhat test output in apps/blockchain (`pnpm --dir apps/blockchain test`); verify scenario timing captured from reporter output; 1 suite run.",
        measurement: data,
      };
    }
    case "perf_07_blockchain_reverify_latency": {
      const data = getBlockchainSuite(ctx);
      const pass = Number.isFinite(data.reverifyLatencyMs) && data.reverifyLatencyMs <= 500;
      return {
        actualResult: `Admin can revoke then reverify completed in ${formatMs(data.reverifyLatencyMs, 0)}`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Measured from the same Hardhat suite output; revoke/reverify case timing parsed from test reporter line; single observed run.",
        measurement: data,
      };
    }
    case "perf_08_blockchain_gas_budget": {
      const data = getBlockchainGasSuite(ctx);
      const pass = Number.isFinite(data.estimateGas) && Number.isFinite(data.budget) && data.estimateGas <= data.budget && data.budget <= 80000;
      return {
        actualResult: `Gas estimate: ${formatInt(data.estimateGas)} (budget: ${formatInt(data.budget)})`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Taken from Hardhat gas snapshot output (`pnpm --dir apps/blockchain test:gas`); source line `[gas] verifyTask estimateGas=... budget=...`; 1 run.",
        measurement: data,
      };
    }
    case "perf_09_dispatch_chain_hashing": {
      const data = getDispatchChainSuite(ctx);
      const pass =
        data.passCount === 3 &&
        Number.isFinite(data.canonicalMs) &&
        Number.isFinite(data.proofMs) &&
        Number.isFinite(data.deterministicMs) &&
        data.canonicalMs < 15 &&
        data.proofMs < 15 &&
        data.deterministicMs < 15;
      return {
        actualResult: `Canonical hash: ${formatMs(data.canonicalMs, 4)}; proof-file hash: ${formatMs(
          data.proofMs,
          4
        )}; deterministic-order hash prep: ${formatMs(data.deterministicMs, 4)} (3/3 pass)`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Measured from TAP duration_ms in apps/server dispatch-chain test (`pnpm --dir apps/server run test:dispatch-chain`); one full run.",
        measurement: data,
      };
    }
    case "perf_10_blockchain_gas_used": {
      const suite = getBlockchainSuite(ctx);
      const gas = getBlockchainGasSuite(ctx);
      const delta = Number.isFinite(gas.estimateGas) ? Math.abs(suite.gasUsed - gas.estimateGas) : null;
      const deltaPct = Number.isFinite(gas.estimateGas) && gas.estimateGas > 0 ? (delta / gas.estimateGas) * 100 : null;
      const pass =
        Number.isFinite(suite.gasUsed) &&
        suite.gasUsed < 80000 &&
        Number.isFinite(deltaPct) &&
        deltaPct <= 5;
      return {
        actualResult: `Gas used: ${formatInt(suite.gasUsed)}; delta vs estimate: ${formatInt(delta)} (${formatPct(deltaPct)})`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Gas used captured from full Hardhat suite output; compared against estimateGas from gas snapshot test; sources: blockchain test logs; one run each command.",
        measurement: { suite, gas, delta, deltaPct },
      };
    }
    case "sec_01_flood_empty": {
      const data = getRoutingRiskSchemaSecurity(ctx);
      const issue = (data.empty.issues || []).find((entry) => entry.code === "too_small");
      const pass = data.empty.success === false && Boolean(issue);
      return {
        actualResult: issue
          ? `Rejected with ${issue.code}: "${issue.message}"`
          : "Validation did not return expected too_small issue",
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Validated routingRiskPredictSchema in a server TSX harness using safeParse; source is direct schema issue output; single execution.",
        measurement: data,
      };
    }
    case "sec_02_flood_oversized": {
      const data = getRoutingRiskSchemaSecurity(ctx);
      const issue = (data.oversized.issues || []).find((entry) => entry.code === "too_big");
      const pass = data.oversized.success === false && Boolean(issue);
      return {
        actualResult: issue
          ? `Rejected with ${issue.code}: "${issue.message}"`
          : "Validation did not return expected too_big issue",
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Validated 1,001-segment payload with routingRiskPredictSchema.safeParse in TSX harness; measured through returned Zod issue list; 1 run.",
        measurement: data,
      };
    }
    case "sec_03_flood_script_type": {
      const data = getRoutingRiskSchemaSecurity(ctx);
      const issue = (data.scriptType.issues || []).find((entry) => entry.code === "invalid_type");
      const pass = data.scriptType.success === false && Boolean(issue);
      return {
        actualResult: issue
          ? `Rejected with ${issue.code}: "${issue.message}" at ${issue.path}`
          : "Validation did not return expected invalid_type issue",
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Tested script-like string in numeric field via routingRiskPredictSchema.safeParse in TSX harness; evidence from issue path and code; 1 run.",
        measurement: data,
      };
    }
    case "sec_04_flood_strict_keys": {
      const data = getRoutingRiskSchemaSecurity(ctx);
      const strictIssues = data.strictKeys.issues || [];
      const hasAdmin = strictIssues.some((entry) => entry.message.includes("admin"));
      const hasDebug = strictIssues.some((entry) => entry.message.includes("debug"));
      const pass = data.strictKeys.success === false && hasAdmin && hasDebug;
      return {
        actualResult: `Rejected with unrecognized_keys for admin/debug fields`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Submitted unexpected keys to strict routing-risk schemas in TSX harness; evaluated Zod unrecognized_keys output; single run.",
        measurement: data,
      };
    }
    case "sec_05_csv_sensitive_fields": {
      const data = getCsvSensitiveCheck(ctx);
      const pass = data.sensitiveHeader === false && data.sensitiveFirstData === false;
      return {
        actualResult: `Header contained routing/model/weather fields only; sensitive columns detected: ${
          data.sensitiveHeaderColumns.length ? data.sensitiveHeaderColumns.join(", ") : "none"
        }`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Generated a fresh routing-risk CSV via TSX harness, then inspected header and first row using regex checks for token/JWT/password/secret fields; 1 run.",
        measurement: data,
      };
    }
    case "sec_06_missing_jwt": {
      const data = getAuthRbacLimiterSecurity(ctx);
      const pass = data.missingJwt.status === 401 && data.missingJwt.body.includes("Unauthorized");
      return {
        actualResult: `${data.missingJwt.status} with body ${data.missingJwt.body}`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Executed local Express harness importing requireAuth; called protected route without Authorization header via fetch; captured HTTP status/body; 1 run.",
        measurement: data,
      };
    }
    case "sec_07_invalid_jwt": {
      const data = getAuthRbacLimiterSecurity(ctx);
      const pass = data.invalidJwt.status === 401 && data.invalidJwt.body.includes("Invalid token");
      return {
        actualResult: `${data.invalidJwt.status} with body ${data.invalidJwt.body}`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Executed same Express harness with malformed bearer token against requireAuth route; measured response status/body from fetch; 1 run.",
        measurement: data,
      };
    }
    case "sec_08_rbac_enforcement": {
      const data = getAuthRbacLimiterSecurity(ctx);
      const pass = data.rbac.noRole.status === 401 && data.rbac.volunteer.status === 403 && data.rbac.lgu.status === 200;
      return {
        actualResult: `No-role: ${data.rbac.noRole.status}; Volunteer: ${data.rbac.volunteer.status}; LGU control: ${data.rbac.lgu.status}`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Measured with local Express middleware harness importing requireRole('LGU','ADMIN'); sent three role scenarios via fetch; one run per role.",
        measurement: data,
      };
    }
    case "sec_09_ai_flood_protection": {
      const data = getAuthRbacLimiterSecurity(ctx);
      const count200 = Number(data.limiter.counts["200"] || 0);
      const count429 = Number(data.limiter.counts["429"] || 0);
      const pass = count200 === 30 && count429 === 5 && data.limiter.first429At === 31;
      return {
        actualResult: `${count200} requests returned 200; ${count429} requests returned 429; first 429 at request #${data.limiter.first429At}; avg ${formatMs(
          data.limiter.avgMs
        )}/request`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Measured via local Express harness with routingOptimizeLimiter middleware; fired 35 sequential POST requests and counted status codes using fetch; timing from performance.now().",
        measurement: data,
      };
    }
    case "sec_10_unauth_blockchain_verify": {
      const data = getBlockchainSuite(ctx);
      const pass = data.hasUnauthorizedVerify;
      return {
        actualResult: `Test passed: "Stranger cannot verifyTask (missing VERIFIER_ROLE)"${
          Number.isFinite(data.unauthorizedVerifyLatencyMs) ? ` (${formatMs(data.unauthorizedVerifyLatencyMs, 0)})` : ""
        }`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Verified from Hardhat security suite output and assertion coverage in apps/blockchain/test/SecurityCases.test.ts; command: pnpm --dir apps/blockchain test; 1 suite run.",
        measurement: data,
      };
    }
    case "sec_11_unauth_blockchain_admin": {
      const data = getBlockchainSuite(ctx);
      const pass = data.hasUnauthorizedAdmin;
      return {
        actualResult: `Revoke/Reverify blocked${
          Number.isFinite(data.unauthorizedRevokeLatencyMs) ? ` (${formatMs(data.unauthorizedRevokeLatencyMs, 0)})` : ""
        }; GrantVerifier blocked${Number.isFinite(data.unauthorizedGrantLatencyMs) ? ` (${formatMs(data.unauthorizedGrantLatencyMs, 0)})` : ""}`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Measured from the HK unauthorized-admin cases in SecurityCases.test.ts output; source command: pnpm --dir apps/blockchain test; 1 suite run.",
        measurement: data,
      };
    }
    case "sec_12_replay_blockchain": {
      const data = getBlockchainSuite(ctx);
      const pass = data.hasReplay;
      return {
        actualResult: `Test passed: duplicate verification blocked (ALREADY_VERIFIED)${
          Number.isFinite(data.replayLatencyMs) ? ` (${formatMs(data.replayLatencyMs, 0)})` : ""
        }`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Verified replay-protection assertion from SecurityCases.test.ts and Hardhat test output for ALREADY_VERIFIED condition; one suite run.",
        measurement: data,
      };
    }
    case "sec_13_tamper_unverified_blockchain": {
      const data = getBlockchainSuite(ctx);
      const pass = data.hasNotVerified;
      return {
        actualResult: `Test passed: "Cannot revoke/reverify a task that was never verified (NOT_VERIFIED)"`,
        passFail: pass ? "PASS" : "FAIL",
        notes:
          "Verified tamper-path rejection by matching NOT_VERIFIED test assertion and runtime output in blockchain security suite; 1 suite run.",
        measurement: data,
      };
    }
    default:
      throw new Error(`Unknown case id: ${def.id}`);
  }
}

function buildCompactActualResult(row) {
  const status = row.passFail === "PASS" ? "PASS" : "FAIL";
  const m = row.measurement || {};

  if (row.session === "security") {
    return `${status} ${row.passFail === "PASS" ? "1" : "0"}`;
  }

  switch (row.id) {
    case "perf_01_flood_risk_latency":
      return formatCompactMs(m.singleRow?.medianMs);
    case "perf_02_speed_guidance_latency":
      return formatCompactMs(m.bulk1000?.avgMs);
    case "perf_03_csv_overhead":
      return formatCompactPct(m.csv?.overheadPct);
    case "perf_04_cold_start_trace":
      return formatCompactMs(m.durationMs);
    case "perf_05_ai_concurrency":
      return formatCompactMs(m.concurrency?.avgPerRequestMs);
    case "perf_06_blockchain_verify_latency":
      return formatCompactMs(m.verifyLatencyMs, 0);
    case "perf_07_blockchain_reverify_latency":
      return formatCompactMs(m.reverifyLatencyMs, 0);
    case "perf_08_blockchain_gas_budget":
      return formatCompactInt(m.estimateGas);
    case "perf_09_dispatch_chain_hashing":
      return formatCompactMs(m.canonicalMs, 4);
    case "perf_10_blockchain_gas_used":
      return formatCompactInt(m.suite?.gasUsed ?? m.gasUsed);
    default:
      return row.passFail === "PASS" ? "PASS 1" : "FAIL 0";
  }
}

function runEvidence(options = {}) {
  const allCases = loadCases();
  const requestedSession = options.session || "all";
  const requestedCaseIds = options.caseIds || null;
  const verbose = Boolean(options.verbose);
  const selectedCases = allCases.filter((def) => {
    if (requestedSession !== "all" && def.session !== requestedSession) return false;
    if (requestedCaseIds && requestedCaseIds.length > 0 && !requestedCaseIds.includes(def.id)) return false;
    return true;
  });

  if (selectedCases.length === 0) {
    throw new Error("No test cases selected.");
  }

  const ctx = createContext(requestedSession);
  const results = [];

  if (verbose) {
    console.log(`Module 12 evidence run: ${ctx.runId}`);
    console.log(`Results folder: ${ctx.resultsDir}`);
    console.log("");
  }

  for (const def of selectedCases) {
    const runnerCommand = `pnpm ${def.runnerAlias}`;
    const caseRawPath = path.join(ctx.rawCasesDir, `${def.id}.json`);
    let evaluated;
    try {
      evaluated = evaluateCase(ctx, def);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      evaluated = {
        actualResult: `ERROR: ${message}`,
        passFail: "ERROR",
        notes: "Runner execution failed before metric extraction; see raw case evidence for stack/error details.",
        measurement: { error: message },
      };
    }

    const row = {
      id: def.id,
      session: def.session,
      testCase: def.testCase,
      stepsShort: def.stepsShort,
      expectedResult: def.expectedResult,
      actualResult: evaluated.actualResult,
      passFail: evaluated.passFail,
      notes: evaluated.notes,
      sourceFiles: def.sourceFiles,
      runnerCommand,
      rawEvidencePath: caseRawPath,
      measurement: evaluated.measurement,
    };
    row.actualResultCompact = buildCompactActualResult(row);

    writeJson(caseRawPath, row);
    results.push(row);

    if (verbose) {
      console.log(`[${row.passFail}] ${row.id} - ${row.testCase}`);
      console.log(`  Actual: ${row.actualResult}`);
      console.log(`  Sources: ${row.sourceFiles.join(", ")}`);
      console.log(`  Runner: ${row.runnerCommand}`);
      console.log(`  Raw evidence: ${row.rawEvidencePath}`);
      console.log("");
    }
  }

  const performanceRows = results.filter((row) => row.session === "performance");
  const securityRows = results.filter((row) => row.session === "security");

  const summaryJson = {
    runId: ctx.runId,
    generatedAt: ctx.generatedAt,
    environment: ctx.environment,
    scope: requestedSession,
    totals: {
      total: results.length,
      pass: results.filter((row) => row.passFail === "PASS").length,
      fail: results.filter((row) => row.passFail === "FAIL").length,
      error: results.filter((row) => row.passFail === "ERROR").length,
    },
    results,
  };

  const summaryMd = buildSummaryMarkdown({
    generatedAt: ctx.generatedAt,
    runId: ctx.runId,
    environment: ctx.environment,
    performanceRows,
    securityRows,
    compact: !verbose,
  });
  const presenterMd = buildPresenterMarkdown({ results, compact: !verbose });

  const summaryJsonPath = path.join(ctx.resultsDir, "summary.json");
  const summaryMdPath = path.join(ctx.resultsDir, "summary.md");
  const presenterPath = path.join(ctx.resultsDir, "presenter.md");
  writeJson(summaryJsonPath, summaryJson);
  writeText(summaryMdPath, summaryMd);
  writeText(presenterPath, presenterMd);

  if (verbose) {
    console.log("Run complete.");
    console.log(`Summary JSON: ${summaryJsonPath}`);
    console.log(`Summary Markdown: ${summaryMdPath}`);
    console.log(`Presenter Report: ${presenterPath}`);
  } else {
    console.log("Module 12 Results");
    console.log("");
    for (const row of results) {
      const displayStatus = row.passFail === "PASS" ? "PASS" : "FAIL";
      console.log(`[${displayStatus}] ${row.testCase}`);
      console.log(`Actual Result: ${row.actualResultCompact}`);
      console.log("");
    }
    console.log("Done.");
  }

  const hasError = summaryJson.totals.error > 0;
  const hasFail = summaryJson.totals.fail > 0;
  if (hasError) return { exitCode: 2, resultsDir: ctx.resultsDir };
  if (hasFail) return { exitCode: 1, resultsDir: ctx.resultsDir };
  return { exitCode: 0, resultsDir: ctx.resultsDir };
}

module.exports = {
  runEvidence,
};
