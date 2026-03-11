import type { DispatchOffer } from "../models/dispatch";

const MOVING_SPEED_THRESHOLD_MPS = 0.5;

function hasRecentLocationSignal(offer: DispatchOffer) {
  return Boolean(offer.lastKnownLocationAt ?? offer.lastKnownLocation?.at);
}

function hasMovementSignal(offer: DispatchOffer) {
  const speed = Number(offer.lastKnownLocation?.speed);
  if (Number.isFinite(speed) && speed >= MOVING_SPEED_THRESHOLD_MPS) {
    return true;
  }
  return hasRecentLocationSignal(offer);
}

export function isDispatchOfferEnRoute(offer: DispatchOffer | null | undefined) {
  if (!offer) return false;
  if (offer.status !== "ACCEPTED") return false;
  return hasMovementSignal(offer);
}

function hasProofUploads(offer: DispatchOffer | null | undefined) {
  if (!offer) return false;
  return Array.isArray(offer.proofs) && offer.proofs.length > 0;
}

export function getDispatchStatusLabel(offer: DispatchOffer | null | undefined) {
  const status = String(offer?.status ?? "").toUpperCase();
  if (status === "PENDING") return "Pending Response";
  if (status === "ACCEPTED") return isDispatchOfferEnRoute(offer) ? "En Route" : "Assigned";
  if (status === "DONE") return "For Review";
  if (status === "VERIFIED") return "Verified";
  if (status === "DECLINED") return "Declined";
  if (status === "CANCELLED") return "Cancelled";
  return status || "\u2014";
}

export type DispatchProgressStage =
  | "assigned"
  | "en_route"
  | "arrived"
  | "completed";

export type DispatchProgressStep = {
  key: DispatchProgressStage;
  label: string;
  done: boolean;
  active: boolean;
};

const PROGRESS_FLOW: DispatchProgressStage[] = [
  "assigned",
  "en_route",
  "arrived",
  "completed",
];

const PROGRESS_LABELS: Record<DispatchProgressStage, string> = {
  assigned: "Assigned",
  en_route: "En route",
  arrived: "Arrived",
  completed: "Completed",
};

export function getDispatchProgressStage(offer: DispatchOffer | null | undefined): DispatchProgressStage {
  if (!offer) return "assigned";
  if (offer.status === "VERIFIED" || offer.status === "DONE") return "completed";
  // "Arrived" is a UI-derived milestone based on on-scene proof uploads.
  if (offer.status === "ACCEPTED" && hasProofUploads(offer)) return "arrived";
  if (offer.status === "ACCEPTED" && isDispatchOfferEnRoute(offer)) return "en_route";
  return "assigned";
}

export function getDispatchProgressSteps(offer: DispatchOffer | null | undefined): DispatchProgressStep[] {
  const stage = getDispatchProgressStage(offer);
  const stageIndex = PROGRESS_FLOW.indexOf(stage);

  return PROGRESS_FLOW.map((key, index) => ({
    key,
    label: PROGRESS_LABELS[key],
    done: index < stageIndex,
    active: index === stageIndex,
  }));
}
