import { Schema, model, models } from "mongoose";

export type AuditLogDoc = {
  actorId?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
};

const AuditLogSchema = new Schema<AuditLogDoc>(
  {
    actorId: { type: String, index: true, default: "" },
    actorRole: { type: String, index: true, default: "" },
    action: { type: String, required: true, index: true },
    targetType: { type: String, default: "" },
    targetId: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    versionKey: false,
  }
);

export const AuditLog = models.AuditLog || model<AuditLogDoc>("AuditLog", AuditLogSchema, "audit_logs");
