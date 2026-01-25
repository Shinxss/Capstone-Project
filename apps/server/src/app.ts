import express from "express";
import cors from "cors";
import "dotenv/config";
import { lguAuthRouter } from "./routes/auth.lgu";
import { communityAuthRouter } from "./routes/auth.community";

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/api/auth/lgu", lguAuthRouter);
app.use("/api/auth/community", communityAuthRouter);

