import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import "dotenv/config";
import routes from "./features";
import { requireAuth } from "./middlewares/requireAuth";
import { requireRole } from "./middlewares/requireRole";
import { decryptBuffer } from "./utils/aesGcm";


export const app = express();

// optional quick check
app.get("/health", (_req, res) => res.json({ ok: true, service: "lifeline-api" }));

app.use(cors({ origin: true, credentials: true }));

// allow base64 proof uploads (JSON)
app.use(express.json({ limit: "12mb" }));

// serve uploaded proof images
const uploadsDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

// 🔐 Decrypt dispatch proofs on the fly (files are encrypted-at-rest)
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
        // Backward compatibility: old plaintext uploads
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
