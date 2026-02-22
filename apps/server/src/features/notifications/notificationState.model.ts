import { Schema, Types, model, models } from "mongoose";

export type NotificationStateDoc = {
  userId: Types.ObjectId;
  notificationId: string;
  read: boolean;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const NotificationStateSchema = new Schema<NotificationStateDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    notificationId: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false, index: true },
    archived: { type: Boolean, default: false, index: true },
  },
  {
    strict: "throw",
    timestamps: true,
  }
);

NotificationStateSchema.index({ userId: 1, notificationId: 1 }, { unique: true });
NotificationStateSchema.index({ userId: 1, updatedAt: -1 });

export const NotificationState =
  models.NotificationState || model<NotificationStateDoc>("NotificationState", NotificationStateSchema);

