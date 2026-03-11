import { predictRoutingRiskCosts } from "../../../../apps/server/src/features/routingRisk/routingRisk.service";

const JSON_START = "MODULE12_EVIDENCE_JSON_START";
const JSON_END = "MODULE12_EVIDENCE_JSON_END";

async function run() {
  const segments = [
    { flood_depth_5yr: 0.1, rainfall_mm: 2, is_raining: 0 as const, bridge: 0 as const, road_priority: 0 as const },
    { flood_depth_5yr: 2.0, rainfall_mm: 80, is_raining: 1 as const, bridge: 1 as const, road_priority: 3 as const },
  ];

  const t0 = performance.now();
  const outputs = await predictRoutingRiskCosts(segments);
  const t1 = performance.now();

  console.log(JSON_START);
  console.log(
    JSON.stringify(
      {
        durationMs: t1 - t0,
        outputs,
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
