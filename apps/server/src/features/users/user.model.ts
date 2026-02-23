import { Schema, model, models } from "mongoose";

export type UserRole = "ADMIN" | "LGU" | "VOLUNTEER" | "COMMUNITY";
export type AdminTier = "SUPER" | "CDRRMO";
export type VolunteerStatus = "NONE" | "PENDING" | "APPROVED";
export type AuthProvider = "local" | "google" | "both";

export type UserDoc = {
  username?: string;
  email?: string;

  firstName: string;
  lastName: string;

  passwordHash?: string;
  googleSub?: string;
  authProvider?: AuthProvider;
  emailVerified: boolean;

  role: UserRole;
  adminTier?: AdminTier;
  permissions?: string[];

  lguName?: string;
  lguPosition?: string;
  barangay?: string;
  municipality?: string;

  volunteerStatus: VolunteerStatus;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
};

/** Sensitive fields stripped from JSON / object serialisation */
const SENSITIVE_FIELDS = ["passwordHash", "googleSub", "__v"] as const;

function stripSensitive(_doc: unknown, ret: Record<string, unknown>) {
  for (const f of SENSITIVE_FIELDS) delete ret[f];
  return ret;
}

const UserSchema = new Schema<UserDoc>(
  {
    username: { type: String, trim: true, maxlength: 64 },
    email: { type: String, lowercase: true, trim: true, maxlength: 254 },

    firstName: { type: String, default: "", trim: true, maxlength: 100 },
    lastName: { type: String, default: "", trim: true, maxlength: 100 },

    passwordHash: { type: String, default: "" },
    googleSub: { type: String, default: "", trim: true },
    authProvider: { type: String, enum: ["local", "google", "both"], default: "local" },
    emailVerified: { type: Boolean, default: false, index: true },

    role: {
      type: String,
      required: true,
      enum: ["ADMIN", "LGU", "VOLUNTEER", "COMMUNITY"],
      index: true,
    },
    adminTier: {
      type: String,
      enum: ["SUPER", "CDRRMO"],
      index: true,
    },
    permissions: { type: [String], default: undefined },

    lguName: { type: String, default: "", trim: true, maxlength: 200 },
    lguPosition: { type: String, default: "", trim: true, maxlength: 200 },
    barangay: { type: String, default: "", trim: true, maxlength: 200 },
    municipality: { type: String, default: "", trim: true, maxlength: 200 },

    volunteerStatus: {
      type: String,
      enum: ["NONE", "PENDING", "APPROVED"],
      default: "NONE",
      index: true,
    },

    isActive: { type: Boolean, default: true },
  },
  {
    strict: "throw",
    timestamps: true,
    toJSON: { transform: stripSensitive },
    toObject: { transform: stripSensitive },
  }
);

type UserUpdateQuery = {
  role?: unknown;
  adminTier?: unknown;
  $set?: Record<string, unknown>;
  $setOnInsert?: Record<string, unknown>;
  [key: string]: unknown;
};

function applyAdminTierDefaultsForDoc(doc: { role?: unknown; adminTier?: unknown }) {
  if (doc.role === "ADMIN") {
    if (!doc.adminTier) {
      doc.adminTier = "CDRRMO";
    }
    return;
  }

  if (doc.role) {
    doc.adminTier = undefined;
  }
}

function applyAdminTierDefaultsForUpdate(update: UserUpdateQuery) {
  const set = (update.$set ??= {});
  const setOnInsert = (update.$setOnInsert ??= {});

  const role = set.role ?? setOnInsert.role ?? update.role;
  const adminTier = set.adminTier ?? setOnInsert.adminTier ?? update.adminTier;

  if (role === "ADMIN" && !adminTier) {
    setOnInsert.adminTier = "CDRRMO";
  }

  if (role && role !== "ADMIN") {
    delete set.adminTier;
    delete setOnInsert.adminTier;
  }
}

UserSchema.pre("validate", function normalizeAdminTierForDocument() {
  applyAdminTierDefaultsForDoc(this as unknown as { role?: unknown; adminTier?: unknown });
});

UserSchema.pre(["updateOne", "findOneAndUpdate", "updateMany"], function normalizeAdminTierForQuery() {
  const update = this.getUpdate() as UserUpdateQuery | UserUpdateQuery[] | undefined;
  if (!update || Array.isArray(update)) return;

  applyAdminTierDefaultsForUpdate(update);
  this.setUpdate(update);
});

UserSchema.index(
  { username: 1 },
  {
    unique: true,
    partialFilterExpression: { username: { $type: "string", $ne: "" } },
  }
);

UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: "string", $ne: "" } },
  }
);

UserSchema.index(
  { googleSub: 1 },
  {
    unique: true,
    partialFilterExpression: { googleSub: { $type: "string", $ne: "" } },
  }
);

export const User = models.User || model<UserDoc>("User", UserSchema);
