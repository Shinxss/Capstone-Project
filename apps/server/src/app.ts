import express from "express";
import cors from "cors";
import "dotenv/config";
import routes from "./features";

export const app = express();


// optional quick check
app.get("/health", (_req, res) => res.json({ ok: true, service: "lifeline-api" }));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());


app.use("/api", routes);
