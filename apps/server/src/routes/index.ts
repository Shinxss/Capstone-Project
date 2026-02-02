import { Router } from "express";
import authRoutes from "./auth";

const router = Router();

// optional quick check
router.get("/health", (_req, res) => res.json({ ok: true, service: "lifeline-api" }));

// feature routes
router.use("/auth", authRoutes);

export default router;
