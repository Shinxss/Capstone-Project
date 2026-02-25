// Deprecated compatibility module.
// Single source of truth now lives in ../routingRisk/routingRisk.service.ts.
export type { RoutingRiskFeatureRow as RoutingRiskModelRow } from "../routingRisk/routingRisk.service";

import { predictRoutingCost } from "../routingRisk/routingRisk.service";

export async function predictRoutingRiskCosts(
  rows: import("../routingRisk/routingRisk.service").RoutingRiskFeatureRow[]
): Promise<number[]> {
  return predictRoutingCost(rows);
}
