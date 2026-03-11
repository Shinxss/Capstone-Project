import { routingRiskPredictSchema } from "../../../../apps/server/src/features/routingRisk/routingRisk.schema";

const JSON_START = "MODULE12_EVIDENCE_JSON_START";
const JSON_END = "MODULE12_EVIDENCE_JSON_END";

function makeSegments(count: number) {
  return Array.from({ length: count }, () => ({
    flood_depth_5yr: 0,
    rainfall_mm: 0,
    is_raining: 0 as const,
    bridge: 0 as const,
    road_priority: 0 as const,
  }));
}

function summarizeIssues(input: unknown) {
  const result = routingRiskPredictSchema.safeParse(input);
  if (result.success) {
    return { success: true as const, issues: [] as Array<{ path: string; code: string; message: string }> };
  }
  return {
    success: false as const,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      code: issue.code,
      message: issue.message,
    })),
  };
}

async function run() {
  const empty = summarizeIssues({ segments: [] });
  const oversized = summarizeIssues({ segments: makeSegments(1001) });
  const scriptType = summarizeIssues({
    segments: [{ flood_depth_5yr: "<script>alert(1)</script>" as any, rainfall_mm: 1, is_raining: 0, bridge: 0, road_priority: 0 }],
  });
  const strictKeys = summarizeIssues({
    segments: [{ flood_depth_5yr: 0, rainfall_mm: 0, is_raining: 0, bridge: 0, road_priority: 0, admin: true }],
    debug: "token=abc",
  } as any);

  const output = {
    empty,
    oversized,
    scriptType,
    strictKeys,
  };

  console.log(JSON_START);
  console.log(JSON.stringify(output, null, 2));
  console.log(JSON_END);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
