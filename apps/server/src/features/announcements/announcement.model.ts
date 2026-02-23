import { Schema, Types, model, models } from "mongoose";

export type AnnouncementAudience = "LGU" | "VOLUNTEER" | "PUBLIC" | "ALL";
export type AnnouncementStatus = "DRAFT" | "PUBLISHED";

export type AnnouncementDoc = {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  createdBy?: Types.ObjectId;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const AnnouncementSchema = new Schema<AnnouncementDoc>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    audience: {
      type: String,
      required: true,
      enum: ["LGU", "VOLUNTEER", "PUBLIC", "ALL"],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["DRAFT", "PUBLISHED"],
      default: "DRAFT",
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    publishedAt: { type: Date, default: null },
  },
  {
    strict: "throw",
    timestamps: true,
    versionKey: false,
  }
);

AnnouncementSchema.index({ status: 1, audience: 1, publishedAt: -1 });

export const AnnouncementModel =
  models.Announcement || model<AnnouncementDoc>("Announcement", AnnouncementSchema, "announcements");
