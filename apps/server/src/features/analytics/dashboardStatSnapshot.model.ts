import { Schema, model, models } from "mongoose";

export type DashboardStatSnapshotScopeType = "CITY" | "BARANGAY";

export type DashboardStatSnapshotMetrics = {
  activeEmergencies: number;
  availableVolunteers: number;
  totalVolunteers: number;
  tasksInProgress: number;
  pendingTasks: number;
  responseRate: number;
  respondedTasks: number;
  dispatchOffers: number;
};

export type DashboardStatSnapshotDoc = {
  scopeKey: string;
  scopeType: DashboardStatSnapshotScopeType;
  barangayName?: string | null;
  municipality?: string | null;
  bucketStart: Date;
  bucketMinutes: number;
  comparisonWindowHours: number;
  metrics: DashboardStatSnapshotMetrics;
  createdAt: Date;
  updatedAt: Date;
};

const DashboardStatSnapshotSchema = new Schema<DashboardStatSnapshotDoc>(
  {
    scopeKey: { type: String, required: true, trim: true, index: true },
    scopeType: { type: String, enum: ["CITY", "BARANGAY"], required: true, index: true },
    barangayName: { type: String, default: null },
    municipality: { type: String, default: null },
    bucketStart: { type: Date, required: true, index: true },
    bucketMinutes: { type: Number, required: true, default: 60 },
    comparisonWindowHours: { type: Number, required: true, default: 24 },
    metrics: {
      activeEmergencies: { type: Number, required: true, default: 0 },
      availableVolunteers: { type: Number, required: true, default: 0 },
      totalVolunteers: { type: Number, required: true, default: 0 },
      tasksInProgress: { type: Number, required: true, default: 0 },
      pendingTasks: { type: Number, required: true, default: 0 },
      responseRate: { type: Number, required: true, default: 0 },
      respondedTasks: { type: Number, required: true, default: 0 },
      dispatchOffers: { type: Number, required: true, default: 0 },
    },
  },
  {
    strict: "throw",
    timestamps: true,
  }
);

DashboardStatSnapshotSchema.index({ scopeKey: 1, bucketStart: 1 }, { unique: true });
DashboardStatSnapshotSchema.index({ scopeKey: 1, bucketStart: -1 });

export const DashboardStatSnapshot =
  models.DashboardStatSnapshot ||
  model<DashboardStatSnapshotDoc>("DashboardStatSnapshot", DashboardStatSnapshotSchema);
