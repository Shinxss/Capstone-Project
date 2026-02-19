import { randomUUID } from "crypto";
import { Schema, model, models } from "mongoose";
import { AUDIT_EVENT, AUDIT_OUTCOME, AUDIT_SEVERITY, type AuditEventType, type AuditOutcome, type AuditSeverity } from "./audit.constants";

type NullableString = string | undefined;

export type AuditLogDoc = {
  eventId: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  action: string;
  outcome: AuditOutcome;
  actor: {
    id?: NullableString;
    role?: NullableString;
    email?: NullableString;
  };
  target: {
    type?: NullableString;
    id?: NullableString;
  };
  source: {
    ip?: NullableString;
    userAgent?: NullableString;
    origin?: NullableString;
  };
  request: {
    method?: NullableString;
    path?: NullableString;
    requestId?: NullableString;
    correlationId?: NullableString;
  };
  metadata: Record<string, unknown>;
};

const AuditLogSchema = new Schema<AuditLogDoc>(
  {
    eventId: { type: String, required: true, unique: true, index: true, default: () => randomUUID() },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    eventType: {
      type: String,
      required: true,
      index: true,
      enum: Object.values(AUDIT_EVENT),
    },
    severity: {
      type: String,
      required: true,
      enum: Object.values(AUDIT_SEVERITY),
    },
    action: { type: String, required: true },
    outcome: {
      type: String,
      required: true,
      index: true,
      enum: Object.values(AUDIT_OUTCOME),
    },
    actor: {
      id: { type: String, default: "", index: true },
      role: { type: String, default: "" },
      email: { type: String, default: "" },
    },
    target: {
      type: { type: String, default: "" },
      id: { type: String, default: "" },
    },
    source: {
      ip: { type: String, default: "" },
      userAgent: { type: String, default: "" },
      origin: { type: String, default: "" },
    },
    request: {
      method: { type: String, default: "" },
      path: { type: String, default: "" },
      requestId: { type: String, default: "" },
      correlationId: { type: String, default: "", index: true },
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    strict: "throw",
    versionKey: false,
  }
);

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ eventType: 1 });
AuditLogSchema.index({ "actor.id": 1 });
AuditLogSchema.index({ outcome: 1 });
AuditLogSchema.index({ "request.correlationId": 1 });
AuditLogSchema.index({ "target.type": 1, "target.id": 1 });

AuditLogSchema.pre("updateOne", function appendOnlyUpdate() {
  throw new Error("Audit logs are append-only and cannot be modified.");
});

AuditLogSchema.pre("updateMany", function appendOnlyUpdateMany() {
  throw new Error("Audit logs are append-only and cannot be modified.");
});

AuditLogSchema.pre("findOneAndUpdate", function appendOnlyFindOneAndUpdate() {
  throw new Error("Audit logs are append-only and cannot be modified.");
});

AuditLogSchema.pre("replaceOne", function appendOnlyReplace() {
  throw new Error("Audit logs are append-only and cannot be modified.");
});

AuditLogSchema.pre("deleteOne", function appendOnlyDeleteOne() {
  throw new Error("Audit logs are append-only and cannot be modified.");
});

AuditLogSchema.pre("deleteMany", function appendOnlyDeleteMany() {
  throw new Error("Audit logs are append-only and cannot be modified.");
});

AuditLogSchema.pre("findOneAndDelete", function appendOnlyFindOneAndDelete() {
  throw new Error("Audit logs are append-only and cannot be modified.");
});

export const AuditLog = models.AuditLog || model<AuditLogDoc>("AuditLog", AuditLogSchema, "audit_logs");
