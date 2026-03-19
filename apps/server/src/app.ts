import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import hpp from "hpp";
import mongoSanitize from "@exortek/express-mongo-sanitize";
import fs from "fs";
import helmet from "helmet";
import path from "path";
import "dotenv/config";
import routes from "./features";
import { requireAuth } from "./middlewares/requireAuth";
import { requireRole } from "./middlewares/requireRole";
import { requestContext } from "./middlewares/requestContext";
import { decryptBuffer } from "./utils/aesGcm";
import { doubleCsrfProtection } from "./middlewares/csrf";
import { AUDIT_EVENT } from "./features/audit/audit.constants";
import { logSecurityEvent } from "./features/audit/audit.service";
import { DispatchOffer } from "./features/dispatches/dispatch.model";
import { EmergencyReportModel } from "./features/emergency/models/EmergencyReport.model";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(requestContext);

app.get("/health", (_req, res) => res.json({ ok: true, service: "lifeline-api" }));

const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const corsOrigin: cors.CorsOptions["origin"] =
  allowedOrigins.length === 0
    ? true
    : (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      };

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token", "x-correlation-id"],
    exposedHeaders: ["x-csrf-token", "x-request-id", "x-correlation-id"],
  })
);

// ── Cookie parser (required before CSRF) ──
app.use(cookieParser());

// ── HTTP parameter pollution protection ──
app.use(hpp());

const isProduction = process.env.NODE_ENV === "production";
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        imgSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: isProduction ? undefined : false,
  })
);

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT ?? "6mb" }));

app.use(
  mongoSanitize({
    replaceWith: "_",
    sanitizeObjects: ["body", "query"],
    customSanitizer: (value) => sanitizeMongoKeys(value),
  })
);

function sanitizeMongoKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeMongoKeys(entry));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const output: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const safeKey = key.replace(/\$/g, "_").replace(/\./g, "_");
    output[safeKey] = sanitizeMongoKeys(raw);
  }
  return output;
}

async function canReadDispatchProof(
  roleRaw: unknown,
  userIdRaw: unknown,
  proofUrl: string
) {
  const role = String(roleRaw ?? "").trim().toUpperCase();
  if (role === "ADMIN" || role === "LGU") return true;

  const userId = String(userIdRaw ?? "").trim();
  if (!userId) return false;

  const offer = await DispatchOffer.findOne({
    proofs: {
      $elemMatch: {
        url: proofUrl,
      },
    },
  })
    .select("emergencyId volunteerId")
    .lean();

  if (!offer) return false;

  if (role === "VOLUNTEER") {
    return String(offer.volunteerId ?? "") === userId;
  }

  if (role !== "COMMUNITY") return false;

  if (!offer.emergencyId) return false;

  const ownedReport = await EmergencyReportModel.findOne({
    _id: offer.emergencyId,
    reportedBy: userId,
  })
    .select("_id")
    .lean();

  return Boolean(ownedReport?._id);
}

app.use((req, _res, next) => {
  req.params = sanitizeMongoKeys(req.params) as Record<string, string>;
  next();
});

// ── CSRF protection (double-submit cookie) ──
// Enforced on unsafe methods for browser-origin requests only.
// Mobile clients (no Origin/Referer) bypass automatically.
app.use(doubleCsrfProtection);

const uploadsDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
const dispatchProofsDir = path.join(uploadsDir, "dispatch-proofs");
const emergencyReportPhotosDir = path.join(uploadsDir, "emergency-report-photos");
const profileAvatarsDir = path.join(uploadsDir, "profile-avatars");
fs.mkdirSync(dispatchProofsDir, { recursive: true });
fs.mkdirSync(emergencyReportPhotosDir, { recursive: true });
fs.mkdirSync(profileAvatarsDir, { recursive: true });

app.get(
  "/uploads/dispatch-proofs/:filename",
  requireAuth,
  async (req, res) => {
    try {
      const requested = String(req.params.filename || "");
      const filename = path.basename(requested);
      if (!filename || filename !== requested) {
        return res.status(400).json({ message: "Invalid filename" });
      }

      const proofUrl = `/uploads/dispatch-proofs/${filename}`;
      const canRead = await canReadDispatchProof(req.role ?? req.user?.role, req.userId ?? req.user?.id, proofUrl);
      if (!canRead) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const abs = path.join(dispatchProofsDir, filename);
      if (!fs.existsSync(abs)) return res.status(404).end();

      const raw = fs.readFileSync(abs);
      let plain: Buffer;
      try {
        plain = decryptBuffer(raw);
      } catch {
        plain = raw;
      }

      const ext = path.extname(filename).toLowerCase();
      if (ext === ".png") res.type("png");
      else if (ext === ".jpg" || ext === ".jpeg") res.type("jpeg");
      else if (ext === ".heic") res.type("heic");
      else res.type("application/octet-stream");

      return res.send(plain);
    } catch {
      return res.status(500).end();
    }
  }
);

app.get(
  "/uploads/emergency-report-photos/:filename",
  requireAuth,
  requireRole("VOLUNTEER", "LGU", "ADMIN"),
  (req, res) => {
    try {
      const requested = String(req.params.filename || "");
      const filename = path.basename(requested);
      if (!filename || filename !== requested) {
        return res.status(400).json({ message: "Invalid filename" });
      }

      const abs = path.join(emergencyReportPhotosDir, filename);
      if (!fs.existsSync(abs)) return res.status(404).end();

      const raw = fs.readFileSync(abs);
      let plain: Buffer;
      try {
        plain = decryptBuffer(raw);
      } catch {
        plain = raw;
      }

      const ext = path.extname(filename).toLowerCase();
      if (ext === ".png") res.type("png");
      else if (ext === ".jpg" || ext === ".jpeg") res.type("jpeg");
      else if (ext === ".heic") res.type("heic");
      else res.type("application/octet-stream");

      return res.send(plain);
    } catch {
      return res.status(500).end();
    }
  }
);

app.get(
  "/uploads/profile-avatars/:filename",
  (req, res) => {
    try {
      const requested = String(req.params.filename || "");
      const filename = path.basename(requested);
      if (!filename || filename !== requested) {
        return res.status(400).json({ message: "Invalid filename" });
      }

      const abs = path.join(profileAvatarsDir, filename);
      if (!fs.existsSync(abs)) return res.status(404).end();

      const raw = fs.readFileSync(abs);
      let plain: Buffer;
      try {
        plain = decryptBuffer(raw);
      } catch {
        plain = raw;
      }

      const ext = path.extname(filename).toLowerCase();
      if (ext === ".png") res.type("png");
      else if (ext === ".jpg" || ext === ".jpeg") res.type("jpeg");
      else if (ext === ".heic") res.type("heic");
      else res.type("application/octet-stream");

      return res.send(plain);
    } catch {
      return res.status(500).end();
    }
  }
);

app.use("/api", routes);

// ── Global error handler (returns JSON, avoids Express's raw stack dump) ──
import type { ErrorRequestHandler } from "express";
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status: number =
    typeof err.status === "number" ? err.status :
    typeof err.statusCode === "number" ? err.statusCode : 500;

  if (status === 403 && (err?.code === "CSRF_INVALID" || /csrf/i.test(String(err?.message ?? "")))) {
    void logSecurityEvent(req, AUDIT_EVENT.SECURITY_CSRF_FAIL, "DENY", {
      reason: err?.message,
      path: req.originalUrl,
      method: req.method,
    });
  }

  // Only log unexpected (5xx) errors with full stack
  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    error: err.message || "Internal server error",
    code: err.code,
  });
};
app.use(errorHandler);
