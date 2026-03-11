import fs from "node:fs";
import path from "node:path";
import { predictRoutingRiskCosts } from "../../../../apps/server/src/features/routingRisk/routingRisk.service";

const JSON_START = "MODULE12_EVIDENCE_JSON_START";
const JSON_END = "MODULE12_EVIDENCE_JSON_END";
const SENSITIVE = /password|token|jwt|secret|privatekey|authorization|cookie/i;

async function run() {
  const csvPathArg = process.argv[2];
  const csvPath = csvPathArg || path.join(process.cwd(), "logs", "routing-risk-sensitive-check.csv");
  fs.mkdirSync(path.dirname(csvPath), { recursive: true });
  if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);

  const previousLogRoutingRisk = process.env.LOG_ROUTING_RISK;
  const previousLogPath = process.env.ROUTING_RISK_LOG_PATH;

  try {
    process.env.LOG_ROUTING_RISK = "1";
    process.env.ROUTING_RISK_LOG_PATH = csvPath;

    await predictRoutingRiskCosts([{ flood_depth_5yr: 0.2, rainfall_mm: 3, is_raining: 0, bridge: 0, road_priority: 0 }]);
  } finally {
    if (previousLogRoutingRisk === undefined) delete process.env.LOG_ROUTING_RISK;
    else process.env.LOG_ROUTING_RISK = previousLogRoutingRisk;
    if (previousLogPath === undefined) delete process.env.ROUTING_RISK_LOG_PATH;
    else process.env.ROUTING_RISK_LOG_PATH = previousLogPath;
  }

  const raw = fs.readFileSync(csvPath, "utf8");
  const lines = raw.trim().split(/\r?\n/);
  const header = lines[0] || "";
  const firstDataRow = lines[1] || "";
  const headers = header.split(",");

  const sensitiveHeaderColumns = headers.filter((column) => SENSITIVE.test(column));
  const sensitiveHeader = sensitiveHeaderColumns.length > 0;
  const sensitiveFirstData = SENSITIVE.test(firstDataRow);

  console.log(JSON_START);
  console.log(
    JSON.stringify(
      {
        csvPath,
        header,
        firstDataRow,
        headers,
        sensitiveHeader,
        sensitiveHeaderColumns,
        sensitiveFirstData,
      },
      null,
      2
    )
  );
  console.log(JSON_END);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
