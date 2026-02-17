import cors from "cors";
import express from "express";
import mongoSanitize from "@exortek/express-mongo-sanitize";
import fs from "fs";
import helmet from "helmet";
import path from "path";
import "dotenv/config";
import routes from "./features";
import { requireAuth } from "./middlewares/requireAuth";
import { requireRole } from "./middlewares/requireRole";
import { decryptBuffer } from "./utils/aesGcm";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

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
  })
);

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

app.use(express.json({ limit: "12mb" }));

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

app.use((req, _res, next) => {
  req.params = sanitizeMongoKeys(req.params) as Record<string, string>;
  next();
});

const uploadsDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

app.get(
  "/uploads/dispatch-proofs/:filename",
  requireAuth,
  requireRole("LGU", "ADMIN"),
  (req, res) => {
    try {
      const filename = String(req.params.filename || "");
      const abs = path.join(uploadsDir, "dispatch-proofs", filename);
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
