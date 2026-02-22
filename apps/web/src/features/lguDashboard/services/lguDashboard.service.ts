import type { DispatchTask } from "../../tasks/models/tasks.types";
import { fetchLguTasksByStatus } from "../../tasks/services/tasksApi";
import { fetchDispatchVolunteers } from "../../lguLiveMap/services/volunteers.service";
import type { DashboardOperationalStats } from "../models/lguDashboard.types";

const DASHBOARD_DISPATCH_STATUSES = "PENDING,ACCEPTED,DECLINED,DONE,VERIFIED";

function summarizeDispatchTasks(tasks: DispatchTask[]) {
  let tasksInProgress = 0;
  let pendingTasks = 0;
  let respondedTasks = 0;

  for (const task of tasks ?? []) {
    const status = String(task.status || "").toUpperCase();

    if (status === "ACCEPTED") tasksInProgress += 1;
    if (status === "PENDING") pendingTasks += 1;

    if (status === "ACCEPTED" || status === "DECLINED" || status === "DONE" || status === "VERIFIED") {
      respondedTasks += 1;
    }
  }

  const dispatchOffers = tasks.length;
  const responseRate = dispatchOffers > 0 ? Math.round((respondedTasks / dispatchOffers) * 100) : 0;

  return {
    tasksInProgress,
    pendingTasks,
    respondedTasks,
    dispatchOffers,
    responseRate,
  };
}

export async function fetchLguDashboardOperationalStats(): Promise<DashboardOperationalStats> {
  const [volunteers, tasks] = await Promise.all([
    fetchDispatchVolunteers(),
    fetchLguTasksByStatus(DASHBOARD_DISPATCH_STATUSES),
  ]);

  const availableVolunteers = volunteers.filter((v) => String(v.status).toLowerCase() === "available").length;
  const totalVolunteers = volunteers.length;
  const dispatchStats = summarizeDispatchTasks(tasks);

  return {
    availableVolunteers,
    totalVolunteers,
    tasksInProgress: dispatchStats.tasksInProgress,
    pendingTasks: dispatchStats.pendingTasks,
    responseRate: dispatchStats.responseRate,
    respondedTasks: dispatchStats.respondedTasks,
    dispatchOffers: dispatchStats.dispatchOffers,
  };
}
