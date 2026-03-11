import fs from "node:fs";
import path from "node:path";
import { predictRoutingRiskCosts } from "../../../../apps/server/src/features/routingRisk/routingRisk.service";

const JSON_START = "MODULE12_EVIDENCE_JSON_START";
const JSON_END = "MODULE12_EVIDENCE_JSON_END";

type Row = {
  flood_depth_5yr: number;
  rainfall_mm: number;
  is_raining: 0 | 1;
  bridge: 0 | 1;
  road_priority: 0 | 1 | 2 | 3;
};

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: number[], ratio: number) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(ratio * (sorted.length - 1)));
  return sorted[index];
}

function makeRows(count: number): Row[] {
  return Array.from({ length: count }, (_, i) => ({
    flood_depth_5yr: (i % 50) / 10,
    rainfall_mm: i % 100,
    is_raining: (i % 2) as 0 | 1,
    bridge: ((i + 1) % 2) as 0 | 1,
    road_priority: (i % 4) as 0 | 1 | 2 | 3,
  }));
}

async function run() {
  const csvPathArg = process.argv[2];
  const csvPath = csvPathArg || path.join(process.cwd(), "logs", "routing-risk-evidence.csv");
  fs.mkdirSync(path.dirname(csvPath), { recursive: true });

  const singleRow: Row[] = [{ flood_depth_5yr: 0.3, rainfall_mm: 12, is_raining: 1, bridge: 0, road_priority: 1 }];
  const singleRuns: number[] = [];
  const singleOutputs: Array<{ risk_level?: string; recommended_speed_kph?: number }> = [];
  for (let i = 0; i < 5; i += 1) {
    const t0 = performance.now();
    const output = await predictRoutingRiskCosts(singleRow);
    const t1 = performance.now();
    singleRuns.push(t1 - t0);
    singleOutputs.push(output[0] || {});
  }

  const bulkRows = makeRows(1000);
  const bulkRuns: number[] = [];
  let bulkOutput: Array<{ risk_level?: string; recommended_speed_kph?: number }> = [];
  for (let i = 0; i < 5; i += 1) {
    const t0 = performance.now();
    bulkOutput = await predictRoutingRiskCosts(bulkRows);
    const t1 = performance.now();
    bulkRuns.push(t1 - t0);
  }

  const concurrencyRequests = 20;
  const concurrencyRows = bulkRows.slice(0, 100);
  const concurrencyStart = performance.now();
  const concurrencyOutput = await Promise.all(
    Array.from({ length: concurrencyRequests }, () => predictRoutingRiskCosts(concurrencyRows))
  );
  const concurrencyEnd = performance.now();
  const concurrencySuccess = concurrencyOutput.filter((result) => Array.isArray(result) && result.length === 100).length;

  if (fs.existsSync(csvPath)) {
    fs.unlinkSync(csvPath);
  }

  const previousLogRoutingRisk = process.env.LOG_ROUTING_RISK;
  const previousLogPath = process.env.ROUTING_RISK_LOG_PATH;
  const offRuns: number[] = [];
  const onRuns: number[] = [];
  try {
    process.env.LOG_ROUTING_RISK = "0";
    for (let i = 0; i < 5; i += 1) {
      const t0 = performance.now();
      await predictRoutingRiskCosts(bulkRows);
      const t1 = performance.now();
      offRuns.push(t1 - t0);
    }

    process.env.LOG_ROUTING_RISK = "1";
    process.env.ROUTING_RISK_LOG_PATH = csvPath;
    for (let i = 0; i < 5; i += 1) {
      const t0 = performance.now();
      await predictRoutingRiskCosts(bulkRows);
      const t1 = performance.now();
      onRuns.push(t1 - t0);
    }
  } finally {
    if (previousLogRoutingRisk === undefined) delete process.env.LOG_ROUTING_RISK;
    else process.env.LOG_ROUTING_RISK = previousLogRoutingRisk;
    if (previousLogPath === undefined) delete process.env.ROUTING_RISK_LOG_PATH;
    else process.env.ROUTING_RISK_LOG_PATH = previousLogPath;
  }

  const csvRaw = fs.readFileSync(csvPath, "utf8");
  const csvLines = csvRaw.trim().split(/\r?\n/);
  const header = csvLines[0] || "";
  const firstDataRow = csvLines[1] || "";

  const result = {
    singleRow: {
      runsMs: singleRuns,
      firstRunMs: singleRuns[0],
      medianMs: percentile(singleRuns, 0.5),
      avgMs: average(singleRuns),
      p95Ms: percentile(singleRuns, 0.95),
      riskLevelReturned: singleOutputs.some((item) => typeof item.risk_level === "string"),
    },
    bulk1000: {
      runsMs: bulkRuns,
      avgMs: average(bulkRuns),
      medianMs: percentile(bulkRuns, 0.5),
      p95Ms: percentile(bulkRuns, 0.95),
      riskSet: [...new Set(bulkOutput.map((item) => item.risk_level).filter(Boolean))],
      speedSet: [...new Set(bulkOutput.map((item) => item.recommended_speed_kph).filter((v) => typeof v === "number"))].sort(
        (a, b) => Number(a) - Number(b)
      ),
    },
    concurrency: {
      requests: concurrencyRequests,
      rowsPerRequest: concurrencyRows.length,
      totalMs: concurrencyEnd - concurrencyStart,
      avgPerRequestMs: (concurrencyEnd - concurrencyStart) / concurrencyRequests,
      success: concurrencySuccess,
      failures: concurrencyRequests - concurrencySuccess,
    },
    csv: {
      logPath: csvPath,
      offRunsMs: offRuns,
      onRunsMs: onRuns,
      offAvgMs: average(offRuns),
      onAvgMs: average(onRuns),
      overheadPct: ((average(onRuns) - average(offRuns)) / average(offRuns)) * 100,
      header,
      firstDataRow,
      dataRows: Math.max(0, csvLines.length - 1),
    },
  };

  console.log(JSON_START);
  console.log(JSON.stringify(result, null, 2));
  console.log(JSON_END);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
