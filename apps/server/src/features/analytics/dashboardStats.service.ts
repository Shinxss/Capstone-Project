import { DispatchOffer, type DispatchStatus } from "../dispatches/dispatch.model";
import { EmergencyReport } from "../emergency/emergency.model";
import { listDispatchVolunteers } from "../users/user.service";
import { User } from "../users/user.model";
import {
  DashboardStatSnapshot,
  type DashboardStatSnapshotMetrics,
} from "./dashboardStatSnapshot.model";
import { findBarangayByPoint } from "../barangays/barangay.service";

const DEFAULT_COMPARISON_WINDOW_HOURS = 24;
const SNAPSHOT_BUCKET_MINUTES = 60;
const DASHBOARD_DISPATCH_STATUSES: DispatchStatus[] = [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "DONE",
  "VERIFIED",
];
const RESPONDED_DISPATCH_STATUSES = new Set<DispatchStatus>([
  "ACCEPTED",
  "DECLINED",
  "DONE",
  "VERIFIED",
]);

export type DashboardTrendDirection = "up" | "down" | "neutral";
export type DashboardTrendTone = "good" | "bad" | "neutral";
export type DashboardTrendKind = "count" | "percentagePoints";

export type DashboardTrend = {
  value: number;
  display: string;
  direction: DashboardTrendDirection;
  tone: DashboardTrendTone;
  kind: DashboardTrendKind;
  comparisonLabel: string;
};

export type DashboardStatCardKey =
  | "activeEmergencies"
  | "availableVolunteers"
  | "tasksInProgress"
  | "responseRate";

export type DashboardStatCardItem = {
  key: DashboardStatCardKey;
  label: string;
  value: number;
  valueDisplay: string;
  trend: DashboardTrend;
};

export type DashboardOperationalSummary = {
  activeEmergencies: number;
  availableVolunteers: number;
  totalVolunteers: number;
  tasksInProgress: number;
  pendingTasks: number;
  responseRate: number;
  respondedTasks: number;
  dispatchOffers: number;
};

export type DashboardScopeInfo = {
  key: string;
  type: "city" | "barangay";
  barangayName: string | null;
  municipality: string | null;
  label: string;
};

export type LguDashboardStatCardsResponse = {
  generatedAt: string;
  comparisonWindowHours: number;
  comparisonLabel: string;
  scope: DashboardScopeInfo;
  stats: DashboardOperationalSummary;
  statCards: DashboardStatCardItem[];
};

type DashboardScope = {
  key: string;
  type: "city" | "barangay";
  barangayName: string | null;
  municipality: string | null;
  label: string;
};

const CARD_LABELS: Record<DashboardStatCardKey, string> = {
  activeEmergencies: "Active Emergencies",
  availableVolunteers: "Available Volunteers",
  tasksInProgress: "Tasks In Progress",
  responseRate: "Response Rate",
};

function normalizeName(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeKeyPart(value: unknown) {
  return normalizeName(value).toLowerCase();
}

function toBucketStart(date: Date, bucketMinutes: number) {
  const bucketMs = Math.max(1, bucketMinutes) * 60_000;
  return new Date(Math.floor(date.getTime() / bucketMs) * bucketMs);
}

function normalizeNumeric(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function formatCompactNumber(value: number) {
  const normalized = normalizeNumeric(value);
  return Number.isInteger(normalized)
    ? normalized.toLocaleString()
    : normalized.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function formatSignedCount(value: number) {
  const normalized = normalizeNumeric(value);
  if (normalized > 0) return `+${formatCompactNumber(normalized)}`;
  if (normalized < 0) return formatCompactNumber(normalized);
  return "0";
}

function formatSignedPercentagePoints(value: number) {
  const normalized = normalizeNumeric(value);
  if (normalized > 0) return `+${formatCompactNumber(normalized)} pts`;
  if (normalized < 0) return `${formatCompactNumber(normalized)} pts`;
  return "0 pts";
}

function toDirection(delta: number): DashboardTrendDirection {
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "neutral";
}

function toTone(
  key: DashboardStatCardKey,
  direction: DashboardTrendDirection
): DashboardTrendTone {
  if (direction === "neutral") return "neutral";
  if (key === "tasksInProgress") return "neutral";

  if (key === "activeEmergencies") {
    return direction === "down" ? "good" : "bad";
  }

  return direction === "up" ? "good" : "bad";
}

function toSnapshotMetrics(stats: DashboardOperationalSummary): DashboardStatSnapshotMetrics {
  return {
    activeEmergencies: stats.activeEmergencies,
    availableVolunteers: stats.availableVolunteers,
    totalVolunteers: stats.totalVolunteers,
    tasksInProgress: stats.tasksInProgress,
    pendingTasks: stats.pendingTasks,
    responseRate: stats.responseRate,
    respondedTasks: stats.respondedTasks,
    dispatchOffers: stats.dispatchOffers,
  };
}

function toCardValueDisplay(key: DashboardStatCardKey, value: number) {
  if (key === "responseRate") return `${formatCompactNumber(value)}%`;
  return formatCompactNumber(value);
}

function toTrend(
  key: DashboardStatCardKey,
  deltaRaw: number,
  comparisonLabel: string
): DashboardTrend {
  const delta = normalizeNumeric(deltaRaw);
  const direction = toDirection(delta);
  const tone = toTone(key, direction);
  const kind: DashboardTrendKind = key === "responseRate" ? "percentagePoints" : "count";
  const display =
    kind === "percentagePoints"
      ? formatSignedPercentagePoints(delta)
      : formatSignedCount(delta);

  return {
    value: delta,
    display,
    direction,
    tone,
    kind,
    comparisonLabel,
  };
}

function buildStatCards(
  current: DashboardOperationalSummary,
  previous: DashboardStatSnapshotMetrics | null,
  comparisonLabel: string
): DashboardStatCardItem[] {
  const currentByKey: Record<DashboardStatCardKey, number> = {
    activeEmergencies: current.activeEmergencies,
    availableVolunteers: current.availableVolunteers,
    tasksInProgress: current.tasksInProgress,
    responseRate: current.responseRate,
  };

  const keys: DashboardStatCardKey[] = [
    "activeEmergencies",
    "availableVolunteers",
    "tasksInProgress",
    "responseRate",
  ];

  return keys.map((key) => {
    // Primary card values must stay live/current.
    // Snapshots are only used to derive trend deltas.
    const value = normalizeNumeric(currentByKey[key]);
    const previousValue = previous
      ? key === "activeEmergencies"
        ? previous.activeEmergencies
        : key === "availableVolunteers"
          ? previous.availableVolunteers
          : key === "tasksInProgress"
            ? previous.tasksInProgress
            : previous.responseRate
      : null;
    const delta = previousValue === null ? 0 : normalizeNumeric(value - normalizeNumeric(previousValue));

    return {
      key,
      label: CARD_LABELS[key],
      value,
      valueDisplay: toCardValueDisplay(key, value),
      trend: toTrend(key, delta, comparisonLabel),
    };
  });
}

async function resolveScopeForActor(
  actorRole: string,
  actorUserId?: string
): Promise<DashboardScope> {
  const role = normalizeName(actorRole).toUpperCase();
  if (role !== "LGU" || !actorUserId) {
    return {
      key: "city:dagupan-city",
      type: "city",
      barangayName: null,
      municipality: "Dagupan City",
      label: "City-wide scope (Dagupan City)",
    };
  }

  const actor = await User.findById(actorUserId)
    .select("barangay municipality")
    .lean();
  const barangayName = normalizeName(actor?.barangay);
  const municipality = normalizeName(actor?.municipality) || "Dagupan City";

  if (!barangayName) {
    return {
      key: "city:dagupan-city",
      type: "city",
      barangayName: null,
      municipality,
      label: "City-wide scope (LGU barangay not configured)",
    };
  }

  return {
    key: `barangay:${normalizeKeyPart(barangayName)}|city:${normalizeKeyPart(municipality)}`,
    type: "barangay",
    barangayName,
    municipality,
    label: `Barangay scope (${barangayName}${municipality ? `, ${municipality}` : ""})`,
  };
}

async function countActiveEmergencies(scope: DashboardScope): Promise<number> {
  const baseFilter = {
    status: { $in: ["OPEN", "ACKNOWLEDGED"] },
    "verification.status": { $ne: "rejected" },
  } as const;

  if (scope.type !== "barangay" || !scope.barangayName) {
    return EmergencyReport.countDocuments(baseFilter);
  }

  const reports = await EmergencyReport.find(baseFilter)
    .select("location")
    .lean();

  const targetBarangay = normalizeKeyPart(scope.barangayName);
  if (!targetBarangay) return 0;

  const coordinatesByKey = new Map<string, [number, number]>();
  for (const report of reports) {
    const coords = report.location?.coordinates;
    const lng = Array.isArray(coords) ? Number(coords[0]) : Number.NaN;
    const lat = Array.isArray(coords) ? Number(coords[1]) : Number.NaN;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    const key = `${lng.toFixed(6)},${lat.toFixed(6)}`;
    if (!coordinatesByKey.has(key)) {
      coordinatesByKey.set(key, [lng, lat]);
    }
  }

  const barangayByCoordinateKey = new Map<string, string | null>();
  await Promise.all(
    Array.from(coordinatesByKey.entries()).map(async ([key, [lng, lat]]) => {
      const resolved = await findBarangayByPoint(lng, lat, {
        city: scope.municipality || undefined,
      }).catch(() => null);
      barangayByCoordinateKey.set(key, normalizeKeyPart(resolved?.name) || null);
    })
  );

  let count = 0;
  for (const report of reports) {
    const coords = report.location?.coordinates;
    const lng = Array.isArray(coords) ? Number(coords[0]) : Number.NaN;
    const lat = Array.isArray(coords) ? Number(coords[1]) : Number.NaN;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    const key = `${lng.toFixed(6)},${lat.toFixed(6)}`;
    const resolvedBarangay = barangayByCoordinateKey.get(key);
    if (resolvedBarangay && resolvedBarangay === targetBarangay) {
      count += 1;
    }
  }

  return count;
}

async function computeDashboardCurrentStats(
  scope: DashboardScope
): Promise<DashboardOperationalSummary> {
  const [activeEmergencies, volunteers, dispatches] = await Promise.all([
    countActiveEmergencies(scope),
    listDispatchVolunteers({ onlyApproved: true, includeInactive: true }),
    DispatchOffer.find({
      status: { $in: DASHBOARD_DISPATCH_STATUSES },
      ...(scope.type === "barangay" && scope.barangayName
        ? { "emergencySnapshot.barangayName": scope.barangayName }
        : {}),
    })
      .select("status")
      .lean(),
  ]);

  const scopedVolunteers =
    scope.type === "barangay" && scope.barangayName
      ? volunteers.filter(
          (volunteer) =>
            normalizeKeyPart(volunteer.barangay) === normalizeKeyPart(scope.barangayName)
        )
      : volunteers;

  const availableVolunteers = scopedVolunteers.filter(
    (volunteer) => normalizeName(volunteer.status).toLowerCase() === "available"
  ).length;
  const totalVolunteers = scopedVolunteers.length;

  let tasksInProgress = 0;
  let pendingTasks = 0;
  let respondedTasks = 0;

  for (const dispatch of dispatches) {
    const status = normalizeName((dispatch as { status?: string }).status).toUpperCase() as DispatchStatus;
    if (status === "ACCEPTED") tasksInProgress += 1;
    if (status === "PENDING") pendingTasks += 1;
    if (RESPONDED_DISPATCH_STATUSES.has(status)) respondedTasks += 1;
  }

  const dispatchOffers = dispatches.length;
  const responseRate =
    dispatchOffers > 0 ? Math.round((respondedTasks / dispatchOffers) * 100) : 0;

  return {
    activeEmergencies,
    availableVolunteers,
    totalVolunteers,
    tasksInProgress,
    pendingTasks,
    responseRate,
    respondedTasks,
    dispatchOffers,
  };
}

async function persistSnapshot(params: {
  scope: DashboardScope;
  now: Date;
  comparisonWindowHours: number;
  stats: DashboardOperationalSummary;
}) {
  const bucketStart = toBucketStart(params.now, SNAPSHOT_BUCKET_MINUTES);
  const metrics = toSnapshotMetrics(params.stats);

  await DashboardStatSnapshot.findOneAndUpdate(
    {
      scopeKey: params.scope.key,
      bucketStart,
    },
    {
      $set: {
        scopeType: params.scope.type === "barangay" ? "BARANGAY" : "CITY",
        barangayName: params.scope.barangayName,
        municipality: params.scope.municipality,
        bucketMinutes: SNAPSHOT_BUCKET_MINUTES,
        comparisonWindowHours: params.comparisonWindowHours,
        metrics,
      },
      $setOnInsert: {
        scopeKey: params.scope.key,
        bucketStart,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return bucketStart;
}

async function findNearestComparisonSnapshot(params: {
  scopeKey: string;
  currentBucketStart: Date;
  comparisonWindowHours: number;
}) {
  const target = new Date(
    params.currentBucketStart.getTime() - params.comparisonWindowHours * 60 * 60 * 1000
  );

  const [olderOrEqual, newer] = await Promise.all([
    DashboardStatSnapshot.findOne({
      scopeKey: params.scopeKey,
      bucketStart: { $lte: target },
    })
      .sort({ bucketStart: -1 })
      .lean(),
    DashboardStatSnapshot.findOne({
      scopeKey: params.scopeKey,
      bucketStart: { $gt: target, $lt: params.currentBucketStart },
    })
      .sort({ bucketStart: 1 })
      .lean(),
  ]);

  const candidates = [olderOrEqual, newer].filter(Boolean) as Array<{
    bucketStart: Date;
    metrics: DashboardStatSnapshotMetrics;
  }>;
  if (candidates.length === 0) return null;

  const targetMs = target.getTime();
  candidates.sort((a, b) => {
    const aDiff = Math.abs(new Date(a.bucketStart).getTime() - targetMs);
    const bDiff = Math.abs(new Date(b.bucketStart).getTime() - targetMs);
    return aDiff - bDiff;
  });

  return candidates[0];
}

function sanitizeComparisonWindowHours(value?: number) {
  const fallback = DEFAULT_COMPARISON_WINDOW_HOURS;
  if (!Number.isFinite(value)) return fallback;
  const rounded = Math.round(Number(value));
  if (rounded < 1) return fallback;
  if (rounded > 24 * 7) return 24 * 7;
  return rounded;
}

export async function getLguDashboardStatCards(params: {
  actorRole: string;
  actorUserId?: string;
  comparisonWindowHours?: number;
}): Promise<LguDashboardStatCardsResponse> {
  const comparisonWindowHours = sanitizeComparisonWindowHours(params.comparisonWindowHours);
  const comparisonLabel = `vs ${comparisonWindowHours}h ago`;
  const scope = await resolveScopeForActor(params.actorRole, params.actorUserId);
  const now = new Date();

  const stats = await computeDashboardCurrentStats(scope);
  const currentBucketStart = await persistSnapshot({
    scope,
    now,
    comparisonWindowHours,
    stats,
  });
  const previousSnapshot = await findNearestComparisonSnapshot({
    scopeKey: scope.key,
    currentBucketStart,
    comparisonWindowHours,
  });

  const statCards = buildStatCards(
    stats,
    previousSnapshot ? previousSnapshot.metrics : null,
    comparisonLabel
  );

  return {
    generatedAt: now.toISOString(),
    comparisonWindowHours,
    comparisonLabel,
    scope: {
      key: scope.key,
      type: scope.type,
      barangayName: scope.barangayName,
      municipality: scope.municipality,
      label: scope.label,
    },
    stats,
    statCards,
  };
}
