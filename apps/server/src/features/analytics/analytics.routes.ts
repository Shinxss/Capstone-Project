import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requirePerm } from "../../middlewares/requirePerm";
import { validate } from "../../middlewares/validate";
import { EmergencyReport } from "../emergency/emergency.model";
import { VolunteerApplication } from "../volunteerApplications/volunteerApplication.model";
import { DispatchOffer } from "../dispatches/dispatch.model";
import { User } from "../users/user.model";

const router = Router();

const overviewQuerySchema = z.object({
  range: z.enum(["7d", "30d"]).default("7d"),
});

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function buildDateRange(range: "7d" | "30d") {
  const days = range === "30d" ? 30 : 7;
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const keys: string[] = [];
  const pointer = new Date(start);
  while (pointer <= end) {
    keys.push(toDateKey(pointer));
    pointer.setDate(pointer.getDate() + 1);
  }

  return { start, end, keys };
}

router.get(
  "/overview",
  requireAuth,
  requireRole("ADMIN", "LGU"),
  requirePerm("analytics.view"),
  validate(overviewQuerySchema, "query"),
  async (req, res) => {
    const { range } = req.query as unknown as z.infer<typeof overviewQuerySchema>;
    const { start, end, keys } = buildDateRange(range);

    let lguBarangay: string | null = null;
    if (req.role === "LGU" && req.userId) {
      const actor = await User.findById(req.userId).select("barangay").lean();
      lguBarangay = actor?.barangay ? String(actor.barangay) : null;
    }

    const dispatchFilter: Record<string, unknown> = { createdAt: { $gte: start, $lte: end } };
    if (req.role === "LGU" && lguBarangay) {
      dispatchFilter["emergencySnapshot.barangayName"] = lguBarangay;
    }

    const volunteerFilter: Record<string, unknown> = { createdAt: { $gte: start, $lte: end } };
    if (req.role === "LGU" && lguBarangay) {
      volunteerFilter.barangay = lguBarangay;
    }

    const [emergencies, volunteerApplications, dispatches] = await Promise.all([
      EmergencyReport.find({ createdAt: { $gte: start, $lte: end } }).select("status createdAt").lean(),
      VolunteerApplication.find(volunteerFilter).select("status createdAt").lean(),
      DispatchOffer.find(dispatchFilter).select("status createdAt").lean(),
    ]);

    const emergencyCounts = { OPEN: 0, ACKNOWLEDGED: 0, RESOLVED: 0 };
    const emergencyTrendByDay = Object.fromEntries(
      keys.map((day) => [day, { date: day, OPEN: 0, ACKNOWLEDGED: 0, RESOLVED: 0 }])
    ) as Record<string, { date: string; OPEN: number; ACKNOWLEDGED: number; RESOLVED: number }>;

    for (const emergency of emergencies) {
      const status = String((emergency as any).status || "").toUpperCase();
      if (status === "OPEN" || status === "ACKNOWLEDGED" || status === "RESOLVED") {
        emergencyCounts[status] += 1;
        const day = toDateKey(new Date((emergency as any).createdAt));
        if (emergencyTrendByDay[day]) {
          emergencyTrendByDay[day][status] += 1;
        }
      }
    }

    const volunteerCounts = { pending: 0, verified: 0 };
    const volunteerTrendByDay = Object.fromEntries(
      keys.map((day) => [day, { date: day, pending: 0, verified: 0 }])
    ) as Record<string, { date: string; pending: number; verified: number }>;

    for (const application of volunteerApplications) {
      const status = String((application as any).status || "");
      const day = toDateKey(new Date((application as any).createdAt));
      if (!volunteerTrendByDay[day]) continue;

      if (status === "pending_verification") {
        volunteerCounts.pending += 1;
        volunteerTrendByDay[day].pending += 1;
      } else if (status === "verified") {
        volunteerCounts.verified += 1;
        volunteerTrendByDay[day].verified += 1;
      }
    }

    const dispatchCounts = { PENDING: 0, ACCEPTED: 0, DONE: 0, VERIFIED: 0 };
    const dispatchTrendByDay = Object.fromEntries(
      keys.map((day) => [day, { date: day, PENDING: 0, ACCEPTED: 0, DONE: 0, VERIFIED: 0 }])
    ) as Record<string, { date: string; PENDING: number; ACCEPTED: number; DONE: number; VERIFIED: number }>;

    for (const dispatch of dispatches) {
      const status = String((dispatch as any).status || "").toUpperCase();
      if (status === "PENDING" || status === "ACCEPTED" || status === "DONE" || status === "VERIFIED") {
        dispatchCounts[status] += 1;
        const day = toDateKey(new Date((dispatch as any).createdAt));
        if (dispatchTrendByDay[day]) {
          dispatchTrendByDay[day][status] += 1;
        }
      }
    }

    const scopeLabel =
      req.role === "LGU"
        ? lguBarangay
          ? `LGU scope (${lguBarangay}) where data supports barangay filtering.`
          : "City-wide scope (barangay filtering unavailable for this LGU account)."
        : "City-wide scope (Dagupan City).";

    return res.json({
      range,
      scopeLabel,
      counts: {
        emergencies: emergencyCounts,
        volunteerApplications: volunteerCounts,
        dispatchTasks: dispatchCounts,
      },
      trends: {
        emergencies: keys.map((day) => emergencyTrendByDay[day]),
        volunteerApplications: keys.map((day) => volunteerTrendByDay[day]),
        dispatchTasks: keys.map((day) => dispatchTrendByDay[day]),
      },
    });
  }
);

export default router;
