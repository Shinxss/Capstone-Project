import express from "express";
import { requireAuth } from "../../../../apps/server/src/middlewares/requireAuth";
import { requireRole } from "../../../../apps/server/src/middlewares/requireRole";
import { routingOptimizeLimiter } from "../../../../apps/server/src/middlewares/rateLimit";

const JSON_START = "MODULE12_EVIDENCE_JSON_START";
const JSON_END = "MODULE12_EVIDENCE_JSON_END";

type HitResult = {
  status: number;
  body: string;
};

async function run() {
  const app = express();
  app.use(express.json());

  app.get("/auth", requireAuth, (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.post(
    "/role",
    (req, _res, next) => {
      (req as any).role = req.headers["x-role"];
      next();
    },
    requireRole("LGU", "ADMIN"),
    (_req, res) => {
      res.status(200).json({ ok: true });
    }
  );

  app.post("/limit", routingOptimizeLimiter, (_req, res) => {
    res.status(200).json({ ok: true });
  });

  const server = await new Promise<import("node:http").Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  try {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to resolve local server address");
    }
    const base = `http://127.0.0.1:${address.port}`;

    async function hit(path: string, init?: RequestInit): Promise<HitResult> {
      const response = await fetch(`${base}${path}`, init);
      return {
        status: response.status,
        body: await response.text(),
      };
    }

    const missingJwt = await hit("/auth");
    const invalidJwt = await hit("/auth", { headers: { authorization: "Bearer not-a-jwt" } });

    const rbacNoRole = await hit("/role", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    const rbacVolunteer = await hit("/role", {
      method: "POST",
      headers: { "content-type": "application/json", "x-role": "VOLUNTEER" },
      body: "{}",
    });
    const rbacLgu = await hit("/role", {
      method: "POST",
      headers: { "content-type": "application/json", "x-role": "LGU" },
      body: "{}",
    });

    const statuses: number[] = [];
    const limiterStart = performance.now();
    for (let i = 0; i < 35; i += 1) {
      const result = await hit("/limit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      statuses.push(result.status);
    }
    const limiterEnd = performance.now();
    const counts = statuses.reduce<Record<string, number>>((acc, status) => {
      const key = String(status);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const output = {
      missingJwt,
      invalidJwt,
      rbac: {
        noRole: rbacNoRole,
        volunteer: rbacVolunteer,
        lgu: rbacLgu,
      },
      limiter: {
        statuses,
        counts,
        first429At: statuses.findIndex((status) => status === 429) + 1,
        totalMs: limiterEnd - limiterStart,
        avgMs: (limiterEnd - limiterStart) / statuses.length,
      },
    };

    console.log(JSON_START);
    console.log(JSON.stringify(output, null, 2));
    console.log(JSON_END);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
