import { fetchEmergencyReports } from "../../emergency/services/emergency.service";
import { fetchDispatchVolunteers } from "../../lguLiveMap/services/volunteers.service";
import {
  listResponderAccounts,
  listDispatchableResponders,
} from "../../responderAccounts/services/responderAccounts.service";
import { listVolunteerApplications } from "../../volunteer/services/lguVolunteerApplications.service";
import { fetchLguTasksByStatus } from "../../tasks/services/tasksApi";
import { DAGUPAN_BARANGAYS } from "../constants/dagupanBarangays.constants";
import type {
  SearchCategory,
  SearchCategoryGroup,
  SearchResultBadgeTone,
  SearchResultItem,
} from "../models/globalSearch.types";

function getEmergencyBadgeTone(type: string, status: string): SearchResultBadgeTone {
  const normType = String(type || "").toUpperCase();
  const normStatus = String(status || "").toLowerCase();
  if (normType === "SOS" || normStatus === "critical") return "red";
  if (normStatus === "resolved" || normStatus === "done") return "emerald";
  if (normStatus === "in_progress" || normStatus === "assigned") return "blue";
  if (normStatus === "pending") return "amber";
  return "purple";
}

function getResponderBadgeTone(onDuty: boolean, status?: string): SearchResultBadgeTone {
  if (status === "available" || onDuty) return "emerald";
  if (status === "busy") return "amber";
  return "gray";
}

export function getReportAndNavItems(portalPathPrefix = "/lgu"): SearchResultItem[] {
  const isLgu = portalPathPrefix.startsWith("/lgu");

  const reports: SearchResultItem[] = [
    {
      id: "rep-incident-analytics",
      category: "REPORT",
      title: "Incident Analytics & Response Times",
      subtitle: "Review emergency response trends, resolution metrics, and dispatch efficiency",
      meta: "Reports & Analytics",
      badge: { label: "Analytics", tone: "blue" },
      path: `${portalPathPrefix}/reports`,
      iconType: "report",
    },
    {
      id: "rep-summary-reports",
      category: "REPORT",
      title: "Disaster Operations Summary Report",
      subtitle: "Exportable PDF and operational audit of recent emergency responses",
      meta: "Reports / Export",
      badge: { label: "Monthly", tone: "blue" },
      path: `${portalPathPrefix}/reports`,
      iconType: "report",
    },
    {
      id: "rep-task-completion-metrics",
      category: "REPORT",
      title: "Task Completion & Responder Logs",
      subtitle: "Detailed performance breakdown of deployed teams and verified tasks",
      meta: "Reports / Dispatch",
      badge: { label: "Logs", tone: "emerald" },
      path: `${portalPathPrefix}/reports`,
      iconType: "report",
    },
  ];

  if (isLgu) {
    return [
      ...reports,
      {
        id: "nav-lgu-dashboard",
        category: "NAVIGATION",
        title: "Dashboard Overview",
        subtitle: "Main control panel, stats, and real-time operational status",
        meta: "Navigation",
        badge: { label: "Main", tone: "blue" },
        path: "/lgu/dashboard",
        iconType: "navigation",
      },
      {
        id: "nav-lgu-live-map",
        category: "NAVIGATION",
        title: "Live Map & Geospatial Dispatch",
        subtitle: "Active incidents, responder tracks, and hazard zones",
        meta: "Operations",
        badge: { label: "Live", tone: "red" },
        path: "/lgu/live-map",
        iconType: "location",
      },
      {
        id: "nav-lgu-audit-log",
        category: "NAVIGATION",
        title: "Audit Trail & Activity Log",
        subtitle: "System audit logs, operator activities, and security history",
        meta: "Security",
        badge: { label: "Audit", tone: "gray" },
        path: "/lgu/audit-log",
        iconType: "navigation",
      },
      {
        id: "nav-lgu-announcements",
        category: "NAVIGATION",
        title: "Announcements & Public Advisories",
        subtitle: "Broadcast public alerts, weather bulletins, and disaster warnings",
        meta: "Broadcasts",
        badge: { label: "Public", tone: "blue" },
        path: "/lgu/announcements",
        iconType: "navigation",
      },
      {
        id: "nav-lgu-approvals",
        category: "NAVIGATION",
        title: "Approvals & Verifications",
        subtitle: "Review pending submissions and citizen reports",
        meta: "Workflow",
        badge: { label: "Review", tone: "amber" },
        path: "/lgu/approvals",
        iconType: "navigation",
      },
      {
        id: "nav-lgu-settings",
        category: "NAVIGATION",
        title: "System Settings",
        subtitle: "Configure portal preferences and notification thresholds",
        meta: "Preferences",
        badge: { label: "Config", tone: "gray" },
        path: "/lgu/settings",
        iconType: "navigation",
      },
    ];
  }

  // Admin portal
  return [
    ...reports,
    {
      id: "nav-admin-dashboard",
      category: "NAVIGATION",
      title: "Admin Dashboard",
      subtitle: "City-wide operational metrics and disaster response health",
      meta: "Overview",
      badge: { label: "Admin", tone: "blue" },
      path: "/admin/dashboard",
      iconType: "navigation",
    },
    {
      id: "nav-admin-live-map",
      category: "NAVIGATION",
      title: "Admin Live Map",
      subtitle: "Geospatial operations, boundary monitoring, and incident tracker",
      meta: "Operations",
      badge: { label: "Live", tone: "red" },
      path: "/admin/live-map",
      iconType: "location",
    },
    {
      id: "nav-admin-analytics",
      category: "REPORT",
      title: "City Emergency Analytics",
      subtitle: "High-level response times, casualty statistics, and triage distributions",
      meta: "Analytics",
      badge: { label: "Analytics", tone: "purple" },
      path: "/admin/analytics",
      iconType: "report",
    },
    {
      id: "nav-admin-audit-trails",
      category: "NAVIGATION",
      title: "Admin Audit Trails",
      subtitle: "Detailed tamper-evident operator and administrator action records",
      meta: "Security",
      badge: { label: "Audit", tone: "gray" },
      path: "/admin/audit-trails",
      iconType: "navigation",
    },
  ];
}

export function getLocationItems(portalPathPrefix = "/lgu"): SearchResultItem[] {
  return DAGUPAN_BARANGAYS.map((b) => {
    const landmarks = (b.landmarks ?? []).slice(0, 2).join(" • ");
    const subtitle = landmarks
      ? `${b.district ? `${b.district} • ` : ""}Dagupan City (${landmarks})`
      : `${b.district ? `${b.district} • ` : ""}Dagupan City, Pangasinan`;

    return {
      id: `loc-${b.name.toLowerCase().replace(/\s+/g, "-")}`,
      category: "LOCATION",
      title: `Barangay ${b.name}`,
      subtitle,
      meta: "Dagupan City, Pangasinan",
      badge: { label: "Barangay", tone: "emerald" },
      path: `${portalPathPrefix}/live-map?lng=${b.coordinates[0]}&lat=${b.coordinates[1]}&zoom=15&label=${encodeURIComponent(b.name)}`,
      coordinates: b.coordinates,
      iconType: "location",
    };
  });
}

// In-memory cache for live operational records
let cachedOperationalData: {
  emergencies: SearchResultItem[];
  responders: SearchResultItem[];
  volunteers: SearchResultItem[];
  tasks: SearchResultItem[];
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 15000; // 15s cache

export async function fetchSearchDataset(portalPathPrefix = "/lgu"): Promise<SearchResultItem[]> {
  const now = Date.now();
  const reportsAndNav = getReportAndNavItems(portalPathPrefix);
  const locationItems = getLocationItems(portalPathPrefix);

  if (cachedOperationalData && now - cachedOperationalData.timestamp < CACHE_TTL_MS) {
    return [
      ...cachedOperationalData.emergencies,
      ...cachedOperationalData.responders,
      ...cachedOperationalData.volunteers,
      ...cachedOperationalData.tasks,
      ...locationItems,
      ...reportsAndNav,
    ];
  }

  // Load live data concurrently across all operational domains
  const [
    emergenciesRes,
    volunteerAppsRes,
    dispatchVolunteersRes,
    respondersRes,
    dispatchRespondersRes,
    tasksRes,
  ] = await Promise.allSettled([
    fetchEmergencyReports(100),
    listVolunteerApplications({ page: 1, limit: 200 }),
    fetchDispatchVolunteers(),
    listResponderAccounts({ page: 1, limit: 200 }),
    listDispatchableResponders(),
    fetchLguTasksByStatus("PENDING,ACCEPTED,DECLINED,DONE,VERIFIED"),
  ]);

  const emergencyItems: SearchResultItem[] = [];
  if (emergenciesRes.status === "fulfilled" && Array.isArray(emergenciesRes.value)) {
    for (const report of emergenciesRes.value) {
      const type = String(report.emergencyType || "Emergency").toUpperCase();
      const ref = report.referenceNumber ? `#${report.referenceNumber}` : "";
      const barangay = report.barangayName || report.locationLabel || "Dagupan City";
      const notes = report.notes ? ` - "${report.notes.slice(0, 45)}..."` : "";
      const reporter =
        typeof report.reportedBy === "object" && report.reportedBy
          ? `${report.reportedBy.firstName ?? ""} ${report.reportedBy.lastName ?? ""}`.trim()
          : report.guestReporter?.fullName || "";

      emergencyItems.push({
        id: `emergency-${report._id}`,
        category: "EMERGENCY",
        title: `${type} Emergency ${ref}`.trim(),
        subtitle: `${barangay}${notes}`,
        meta: reporter ? `Reporter: ${reporter}` : `Status: ${report.status}`,
        badge: {
          label: report.status ? report.status.toUpperCase() : type,
          tone: getEmergencyBadgeTone(type, report.status),
        },
        path: `${portalPathPrefix}/live-map?emergencyId=${encodeURIComponent(report._id)}`,
        coordinates: report.location?.coordinates,
        iconType: "emergency",
        rawStatus: report.status,
      });
    }
  }

  // Responders from both account records and dispatchable operational rosters
  const responderItems: SearchResultItem[] = [];
  const seenResponderIds = new Set<string>();

  if (respondersRes.status === "fulfilled" && Array.isArray(respondersRes.value?.items)) {
    for (const responder of respondersRes.value.items) {
      const id = String(responder.id || "");
      if (!id || seenResponderIds.has(id)) continue;
      seenResponderIds.add(id);

      const fullName = responder.fullName || `${responder.firstName} ${responder.lastName}`.trim();
      const team = responder.team?.name ? `Team: ${responder.team.name}` : "";
      const skills = responder.skills ? `[${responder.skills}]` : "";
      const barangay = responder.barangay ? `Barangay ${responder.barangay}` : "Dagupan City";
      const contact = responder.contactNo || responder.email || responder.username || "";

      responderItems.push({
        id: `responder-${responder.id}`,
        category: "RESPONDER",
        title: fullName || "Responder",
        subtitle: [barangay, team, skills].filter(Boolean).join(" • "),
        meta: [contact, "Official Responder User"].filter(Boolean).join(" • "),
        badge: {
          label: responder.onDuty ? "ON DUTY" : responder.isActive ? "ACTIVE" : "OFFLINE",
          tone: getResponderBadgeTone(responder.onDuty),
        },
        path: `${portalPathPrefix}/responders/accounts`,
        iconType: "responder",
      });
    }
  }

  if (dispatchRespondersRes.status === "fulfilled" && Array.isArray(dispatchRespondersRes.value)) {
    for (const r of dispatchRespondersRes.value) {
      const id = String(r.id || "");
      if (id && seenResponderIds.has(id)) continue;
      if (id) seenResponderIds.add(id);

      const isAvailable = String(r.status || "").toLowerCase() === "available";
      const barangay = r.barangay ? `Barangay ${r.barangay}` : "Dagupan City";
      const team = r.teamName ? `Team: ${r.teamName}` : "";

      responderItems.push({
        id: `responder-${r.id}`,
        category: "RESPONDER",
        title: r.name || "Responder",
        subtitle: [barangay, team, r.skill].filter(Boolean).join(" • "),
        meta: "Official Responder User",
        badge: {
          label: isAvailable ? "AVAILABLE" : "OFFLINE",
          tone: isAvailable ? "emerald" : "gray",
        },
        path: `${portalPathPrefix}/responders/accounts`,
        iconType: "responder",
      });
    }
  }

  // Volunteers from Volunteer Applications (verified & applicants) + Dispatch pool
  const volunteerItems: SearchResultItem[] = [];
  const seenVolunteerIds = new Set<string>();

  if (volunteerAppsRes.status === "fulfilled" && Array.isArray(volunteerAppsRes.value?.items)) {
    for (const app of volunteerAppsRes.value.items) {
      const id = String(app._id || app.userId || "");
      if (!id || seenVolunteerIds.has(id)) continue;
      seenVolunteerIds.add(id);

      const status = String(app.status || "").toLowerCase();
      const isVerified = status === "verified";
      const isPending = status === "pending_verification" || status === "needs_info";

      const subtitleParts = [
        app.barangay ? `Barangay ${app.barangay}` : "Dagupan City",
        app.skillsOther || "Community Volunteer",
      ].filter(Boolean);

      const metaParts = [
        app.mobile || app.email || "",
        app.completedTasks !== undefined ? `${app.completedTasks} tasks` : "",
        isVerified ? "Verified Volunteer User" : "Applicant Volunteer User",
      ].filter(Boolean);

      volunteerItems.push({
        id: `volunteer-app-${app._id}`,
        category: "VOLUNTEER",
        title: app.fullName || "Volunteer",
        subtitle: subtitleParts.join(" • "),
        meta: metaParts.join(" • "),
        badge: {
          label: isVerified ? "VERIFIED" : isPending ? "APPLICANT" : status.toUpperCase(),
          tone: isVerified ? "emerald" : isPending ? "amber" : "gray",
        },
        path: isVerified
          ? `${portalPathPrefix}/volunteers/verified`
          : `${portalPathPrefix}/volunteers/applicants`,
        iconType: "volunteer",
        rawStatus: app.status,
      });
    }
  }

  if (dispatchVolunteersRes.status === "fulfilled" && Array.isArray(dispatchVolunteersRes.value)) {
    for (const v of dispatchVolunteersRes.value) {
      const id = String(v.id || "");
      if (id && seenVolunteerIds.has(id)) continue;
      if (id) seenVolunteerIds.add(id);

      const isAvailable = String(v.status || "").toLowerCase() === "available";
      const barangay = v.barangayName ? `Barangay ${v.barangayName}` : "";

      volunteerItems.push({
        id: `volunteer-${v.id}`,
        category: "VOLUNTEER",
        title: v.name || "Volunteer",
        subtitle: [barangay, v.skill || "General Volunteer"].filter(Boolean).join(" • "),
        meta: [v.teamName ? `Team: ${v.teamName}` : "", "Community Volunteer User"].filter(Boolean).join(" • "),
        badge: {
          label: String(v.status || "OFFLINE").toUpperCase(),
          tone: isAvailable ? "emerald" : "gray",
        },
        path: `${portalPathPrefix}/volunteers/verified`,
        iconType: "volunteer",
      });
    }
  }

  const taskItems: SearchResultItem[] = [];
  if (tasksRes.status === "fulfilled" && Array.isArray(tasksRes.value)) {
    for (const task of tasksRes.value) {
      const emType = task.emergency?.emergencyType || "Emergency";
      const emLoc = task.emergency?.barangayName || "Dagupan";
      const assigned = task.volunteer?.name ? `Assigned to: ${task.volunteer.name}` : "Unassigned";

      taskItems.push({
        id: `task-${task.id}`,
        category: "TASK",
        title: `${emType} Dispatch Task`,
        subtitle: `${emLoc} • ${assigned}`,
        meta: `Status: ${task.status}`,
        badge: {
          label: String(task.status || "TASK").toUpperCase(),
          tone: task.status === "ACCEPTED" ? "blue" : task.status === "DONE" ? "emerald" : "amber",
        },
        path: `${portalPathPrefix}/tasks/in-progress`,
        iconType: "task",
      });
    }
  }

  cachedOperationalData = {
    emergencies: emergencyItems,
    responders: responderItems,
    volunteers: volunteerItems,
    tasks: taskItems,
    timestamp: now,
  };

  return [
    ...emergencyItems,
    ...responderItems,
    ...volunteerItems,
    ...taskItems,
    ...locationItems,
    ...reportsAndNav,
  ];
}

const CATEGORY_SEARCH_SYNONYMS: Record<SearchCategory, string> = {
  EMERGENCY: "emergency emergencies incident incidents sos alert reports report",
  RESPONDER: "responder responders personnel officer firefighter police medic bfp pnp cdrrmo account accounts user users",
  VOLUNTEER: "volunteer volunteers applicant applicants member members citizen community user users",
  TASK: "task tasks dispatch mission assignment missions assignments",
  LOCATION: "location locations barangay barangays place landmark dagupan city address",
  REPORT: "report reports analytics statistics metrics export",
  NAVIGATION: "navigation page pages link menu dashboard view",
  ALL: "",
};

export function scoreSearchItem(item: SearchResultItem, tokens: string[]): number {
  if (tokens.length === 0) return 1;

  let totalScore = 0;
  const title = item.title.toLowerCase();
  const subtitle = item.subtitle.toLowerCase();
  const meta = (item.meta ?? "").toLowerCase();
  const badge = (item.badge?.label ?? "").toLowerCase();
  const categoryStr = item.category.toLowerCase();
  const categorySynonyms = CATEGORY_SEARCH_SYNONYMS[item.category] || "";

  for (const token of tokens) {
    let tokenScore = 0;

    // Title match
    if (title === token) {
      tokenScore += 100;
    } else if (title.startsWith(token)) {
      tokenScore += 70;
    } else if (title.includes(` ${token}`) || title.includes(`-${token}`)) {
      tokenScore += 55;
    } else if (title.includes(token)) {
      tokenScore += 40;
    }

    // Subtitle match (e.g. barangay, skill)
    if (subtitle.startsWith(token)) {
      tokenScore += 30;
    } else if (subtitle.includes(token)) {
      tokenScore += 20;
    }

    // Metadata match (e.g. contact, email, user)
    if (meta.includes(token)) {
      tokenScore += 25;
    }

    // Badge match (e.g. "ON DUTY", "VERIFIED", "OPEN")
    if (badge.includes(token)) {
      tokenScore += 25;
    }

    // Category or role synonym match (e.g. user typed "volunteer", "responder", "user")
    if (categoryStr.includes(token)) {
      tokenScore += 35;
    } else if (categorySynonyms.includes(token)) {
      tokenScore += 25;
    }

    // If a token failed to match ANY of the item's fields, item does not match query
    if (tokenScore === 0) {
      return 0;
    }

    totalScore += tokenScore;
  }

  if (item.category === "EMERGENCY") totalScore += 5;

  return totalScore;
}

export function filterAndRankItems(
  items: SearchResultItem[],
  query: string
): SearchResultItem[] {
  const cleanQuery = query.trim().toLowerCase();
  const tokens = cleanQuery ? cleanQuery.split(/\s+/).filter(Boolean) : [];

  if (tokens.length === 0) {
    return items.slice(0, 15);
  }

  return items
    .map((item) => ({ item, score: scoreSearchItem(item, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}

const CATEGORY_META: Record<
  SearchCategory,
  { label: string; iconType: SearchResultItem["iconType"]; order: number }
> = {
  EMERGENCY: { label: "Emergencies", iconType: "emergency", order: 1 },
  RESPONDER: { label: "Responders", iconType: "responder", order: 2 },
  VOLUNTEER: { label: "Volunteers", iconType: "volunteer", order: 3 },
  TASK: { label: "Tasks", iconType: "task", order: 4 },
  LOCATION: { label: "Locations", iconType: "location", order: 5 },
  REPORT: { label: "Reports & Analytics", iconType: "report", order: 6 },
  NAVIGATION: { label: "Pages & Quick Jump", iconType: "navigation", order: 7 },
  ALL: { label: "All", iconType: "navigation", order: 99 },
};

/**
 * Groups a flat list of results into structured category sections
 * formatted specifically for the anchored results dropdown.
 */
export function groupResultsByCategory(
  items: SearchResultItem[],
  maxPerCategory = 4
): { groups: SearchCategoryGroup[]; totalMatches: number } {
  const map = new Map<SearchCategory, SearchResultItem[]>();

  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }

  const groups: SearchCategoryGroup[] = [];

  const categories = Array.from(map.keys()).sort(
    (a, b) => (CATEGORY_META[a]?.order ?? 99) - (CATEGORY_META[b]?.order ?? 99)
  );

  for (const cat of categories) {
    if (cat === "ALL") continue;
    const catItems = map.get(cat) ?? [];
    if (catItems.length === 0) continue;

    const meta = CATEGORY_META[cat] ?? {
      label: cat,
      iconType: "navigation",
    };

    groups.push({
      category: cat,
      label: meta.label,
      iconType: meta.iconType,
      items: catItems.slice(0, maxPerCategory),
    });
  }

  return { groups, totalMatches: items.length };
}
