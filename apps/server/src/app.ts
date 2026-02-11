import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import "dotenv/config";
import routes from "./features";

export const app = express();

// optional quick check
app.get("/health", (_req, res) => res.json({ ok: true, service: "lifeline-api" }));

app.use(cors({ origin: true, credentials: true }));

// allow base64 proof uploads (JSON)
app.use(express.json({ limit: "12mb" }));

// serve uploaded proof images
const uploadsDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

app.use("/api", routes);
