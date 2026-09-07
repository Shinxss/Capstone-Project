import { fetchEmergencyReports } from "../../emergency/services/emergency.service";
import { fetchDispatchVolunteers } from "../../lguLiveMap/services/volunteers.service";
import { listResponderAccounts } from "../../responderAccounts/services/responderAccounts.service";
import { fetchLguTasksByStatus } from "../../tasks/services/tasksApi";
import { DAGUPAN_BARANGAYS } from "../constants/dagupanBarangays.constants";
import type {
  SearchCategory,
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

export function getNavigationItems(portalPathPrefix = "/lgu"): SearchResultItem[] {
  const isLgu = portalPathPrefix.startsWith("/lgu");

  if (isLgu) {
    return [
      {
        id: "nav-lgu-dashboard",
        category: "NAVIGATION",
        title: "Dashboard",
        subtitle: "Overview of operations, emergency status, and quick stats",
        meta: "Core / Analytics",
        badge: { label: "Main", tone: "blue" },
        path: "/lgu/dashboard",
        iconType: "navigation",
      },
      {
        id: "nav-lgu-live-map",
        category: "NAVIGATION",
        title: "Live Map & Dispatch",
        subtitle: "Real-time incident tracking, live responder presence, and zone hazards",
        meta: "Operations / Geospatial",
        badge: { label: "Live", tone: "red" },
        path: "/lgu/live-map",
        iconType: "location",
      },
      {
        id: "nav-lgu-emergencies",
        category: "NAVIGATION",
        title: "Active Emergencies",
        subtitle: "Manage reported incidents, SOS dispatches, and emergency calls",
        meta: "Operations / SOS",
        badge: { label: "Priority", tone: "red" },
        path: "/lgu/emergencies",
        iconType: "emergency",
      },
      {
        id: "nav-lgu-responders-accounts",
        category: "NAVIGATION",
        title: "Responder Accounts",
        subtitle: "Personnel directory, credentials, duty status, and contact details",
        meta: "Operations / Responders",
        badge: { label: "Directory", tone: "emerald" },
        path: "/lgu/responders/accounts",
        iconType: "responder",
      },
      {
        id: "nav-lgu-responders-teams",
        category: "NAVIGATION",
        title: "Responder Teams",
        subtitle: "Manage rescue units, medical teams, and emergency squads",
        meta: "Operations / Teams",
        badge: { label: "Teams", tone: "emerald" },
        path: "/lgu/responders/teams",
        iconType: "responder",
      },
      {
        id: "nav-lgu-volunteers-verified",
        category: "NAVIGATION",
        title: "Verified Volunteers",
        subtitle: "List of vetted community volunteers ready for deployment",
        meta: "Operations / Volunteers",
        badge: { label: "Volunteers", tone: "emerald" },
        path: "/lgu/volunteers/verified",
        iconType: "volunteer",
      },
      {
        id: "nav-lgu-volunteers-applicants",
        category: "NAVIGATION",
        title: "Volunteer Applicants",
        subtitle: "Review incoming volunteer registrations and background submissions",
        meta: "Operations / Review",
        badge: { label: "Queue", tone: "amber" },
        path: "/lgu/volunteers/applicants",
        iconType: "volunteer",
      },
      {
        id: "nav-lgu-tasks-in-progress",
        category: "NAVIGATION",
        title: "Tasks In Progress",
        subtitle: "Active assignments, dispatches underway, and live tracking",
        meta: "Operations / Tasks",
        badge: { label: "Active", tone: "blue" },
        path: "/lgu/tasks/in-progress",
        iconType: "task",
      },
      {
        id: "nav-lgu-tasks-for-review",
        category: "NAVIGATION",
        title: "Tasks For Review",
        subtitle: "Inspect submitted proofs of completion and verified dispatches",
        meta: "Operations / Review",
        badge: { label: "Verification", tone: "amber" },
        path: "/lgu/tasks/for-review",
        iconType: "task",
      },
      {
        id: "nav-lgu-tasks-completed",
        category: "NAVIGATION",
        title: "Completed Tasks",
        subtitle: "Archive of resolved operations and verified disaster responses",
        meta: "Operations / History",
        badge: { label: "Archive", tone: "emerald" },
        path: "/lgu/tasks/completed",
        iconType: "task",
      },
      {
        id: "nav-lgu-approvals",
        category: "NAVIGATION",
        title: "Approvals & Verification",
        subtitle: "Pending approvals for community reports and emergency escalations",
        meta: "Admin / Workflow",
        badge: { label: "Workflow", tone: "purple" },
        path: "/lgu/approvals",
        iconType: "navigation",
      },
      {
        id: "nav-lgu-audit-log",
        category: "NAVIGATION",
        title: "Audit Log & Activity",
        subtitle: "System audit logs, operator activities, and security history",
        meta: "Security / Compliance",
        badge: { label: "Audit", tone: "gray" },
        path: "/lgu/audit-log",
        iconType: "navigation",
      },
      {
        id: "nav-lgu-announcements",
        category: "NAVIGATION",
        title: "Announcements & Advisories",
        subtitle: "Broadcast public alerts, weather updates, and safety notices",
        meta: "Updates / Public Info",
        badge: { label: "Broadcast", tone: "blue" },
        path: "/lgu/announcements",
        iconType: "navigation",
      },
      {
        id: "nav-lgu-reports",
        category: "NAVIGATION",
        title: "Operational Reports",
        subtitle: "Incident reports, response time metrics, and dispatch summaries",
        meta: "Analytics / Reporting",
        badge: { label: "Reports", tone: "blue" },
        path: "/lgu/reports",
        iconType: "navigation",
      },
      {
        id: "nav-lgu-notifications",
        category: "NAVIGATION",
        title: "Notifications Center",
        subtitle: "View all real-time alerts, SOS dispatches, and system updates",
        meta: "Inbox",
        badge: { label: "Alerts", tone: "amber" },
        path: "/lgu/notifications",
        iconType: "navigation",
      },
      {
        id: "nav-lgu-profile",
        category: "NAVIGATION",
        title: "My Profile",
        subtitle: "Account information, credentials, and municipal assignment",
        meta: "Account",
        badge: { label: "User", tone: "gray" },
        path: "/lgu/profile",
        iconType: "navigation",
      },
      {
        id: "nav-lgu-settings",
        category: "NAVIGATION",
        title: "System Settings",
        subtitle: "Configure portal preferences, alerts, and notifications",
        meta: "Preferences",
        badge: { label: "Config", tone: "gray" },
        path: "/lgu/settings",
        iconType: "navigation",
      },
    ];
  }

  // Admin portal
  return [
    {
      id: "nav-admin-dashboard",
      category: "NAVIGATION",
      title: "Admin Dashboard",
      subtitle: "City-wide overview of emergency operations and system statistics",
      meta: "Overview",
      badge: { label: "Admin", tone: "blue" },
      path: "/admin/dashboard",
      iconType: "navigation",
    },
    {
      id: "nav-admin-live-map",
      category: "NAVIGATION",
      title: "Live Map Operations",
      subtitle: "Geospatial incident overview, hazard zones, and responder tracks",
      meta: "Geospatial",
      badge: { label: "Live", tone: "red" },
      path: "/admin/live-map",
      iconType: "location",
    },
    {
      id: "nav-admin-emergency-reports",
      category: "NAVIGATION",
      title: "Emergency Reports",
      subtitle: "City emergency reports registry and triage management",
      meta: "Incidents",
      badge: { label: "Priority", tone: "red" },
      path: "/admin/emergency-reports",
      iconType: "emergency",
    },
    {
      id: "nav-admin-tasks",
      category: "NAVIGATION",
      title: "Tasks Management",
      subtitle: "Dispatch task queues, assignments, and resolution status",
      meta: "Operations",
      badge: { label: "Tasks", tone: "blue" },
      path: "/admin/tasks",
      iconType: "task",
    },
    {
      id: "nav-admin-announcements",
      category: "NAVIGATION",
      title: "Admin Announcements",
      subtitle: "Broadcast city-wide advisories and disaster bulletins",
      meta: "Broadcasts",
      badge: { label: "Public", tone: "blue" },
      path: "/admin/announcements",
      iconType: "navigation",
    },
    {
      id: "nav-admin-analytics",
      category: "NAVIGATION",
      title: "Analytics & Statistics",
      subtitle: "Response rates, incident distribution, and performance data",
      meta: "Analytics",
      badge: { label: "Data", tone: "purple" },
      path: "/admin/analytics",
      iconType: "navigation",
    },
    {
      id: "nav-admin-audit-trails",
      category: "NAVIGATION",
      title: "Audit Trails",
      subtitle: "System security events, user logins, and operational logs",
      meta: "Security",
      badge: { label: "Security", tone: "gray" },
      path: "/admin/audit-trails",
      iconType: "navigation",
    },
    {
      id: "nav-admin-users",
      category: "NAVIGATION",
      title: "User Management",
      subtitle: "Manage accounts, roles, access levels, and tiers",
      meta: "Administration",
      badge: { label: "Users", tone: "emerald" },
      path: "/admin/console/users",
      iconType: "navigation",
    },
    {
      id: "nav-admin-barangays",
      category: "NAVIGATION",
      title: "Barangay Coverage & Boundaries",
      subtitle: "Dagupan City barangay registry, geofences, and coverage areas",
      meta: "Administration",
      badge: { label: "Coverage", tone: "emerald" },
      path: "/admin/console/barangays",
      iconType: "location",
    },
    {
      id: "nav-admin-roles",
      category: "NAVIGATION",
      title: "Roles & Permissions",
      subtitle: "Role-based access control matrix and permission scopes",
      meta: "Security",
      badge: { label: "RBAC", tone: "purple" },
      path: "/admin/console/roles",
      iconType: "navigation",
    },
    {
      id: "nav-admin-master-data",
      category: "NAVIGATION",
      title: "Master Data Management",
      subtitle: "Emergency types, disaster tags, and system taxonomies",
      meta: "System",
      badge: { label: "Config", tone: "gray" },
      path: "/admin/console/master-data",
      iconType: "navigation",
    },
    {
      id: "nav-admin-profile",
      category: "NAVIGATION",
      title: "Admin Profile",
      subtitle: "Administrator details and credentials",
      meta: "Account",
      badge: { label: "Profile", tone: "gray" },
      path: "/admin/profile",
      iconType: "navigation",
    },
    {
      id: "nav-admin-settings",
      category: "NAVIGATION",
      title: "Settings",
      subtitle: "Portal configurations and preferences",
      meta: "Preferences",
      badge: { label: "Config", tone: "gray" },
      path: "/admin/settings",
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

// In-memory cache for live operational records to avoid redundant rapid API calls
let cachedOperationalData: {
  emergencies: SearchResultItem[];
  responders: SearchResultItem[];
  volunteers: SearchResultItem[];
  tasks: SearchResultItem[];
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 15000; // 15 seconds

export async function fetchSearchDataset(portalPathPrefix = "/lgu"): Promise<SearchResultItem[]> {
  const now = Date.now();
  const navItems = getNavigationItems(portalPathPrefix);
  const locationItems = getLocationItems(portalPathPrefix);

  if (cachedOperationalData && now - cachedOperationalData.timestamp < CACHE_TTL_MS) {
    return [
      ...cachedOperationalData.emergencies,
      ...cachedOperationalData.responders,
      ...cachedOperationalData.volunteers,
      ...cachedOperationalData.tasks,
      ...locationItems,
      ...navItems,
    ];
  }

  // Load operational data concurrently with resilience
  const [emergenciesRes, volunteersRes, respondersRes, tasksRes] = await Promise.allSettled([
    fetchEmergencyReports(100),
    fetchDispatchVolunteers(),
    listResponderAccounts({ page: 1, limit: 100 }),
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
        meta: reporter ? `Reported by ${reporter}` : `Status: ${report.status}`,
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

  const responderItems: SearchResultItem[] = [];
  if (respondersRes.status === "fulfilled" && Array.isArray(respondersRes.value?.items)) {
    for (const responder of respondersRes.value.items) {
      const fullName = responder.fullName || `${responder.firstName} ${responder.lastName}`.trim();
      const team = responder.team?.name ? ` • Team: ${responder.team.name}` : "";
      const skills = responder.skills ? `[${responder.skills}]` : "";

      responderItems.push({
        id: `responder-${responder.id}`,
        category: "RESPONDER",
        title: fullName,
        subtitle: `${responder.barangay || "Dagupan City"}${team} ${skills}`.trim(),
        meta: responder.contactNo || responder.email || "Official Responder",
        badge: {
          label: responder.onDuty ? "ON DUTY" : responder.isActive ? "ACTIVE" : "OFFLINE",
          tone: getResponderBadgeTone(responder.onDuty),
        },
        path: `${portalPathPrefix}/responders/accounts`,
        iconType: "responder",
      });
    }
  }

  const volunteerItems: SearchResultItem[] = [];
  if (volunteersRes.status === "fulfilled" && Array.isArray(volunteersRes.value)) {
    for (const volunteer of volunteersRes.value) {
      const isAvailable = String(volunteer.status || "").toLowerCase() === "available";
      const barangay = volunteer.barangayName ? ` • ${volunteer.barangayName}` : "";

      volunteerItems.push({
        id: `volunteer-${volunteer.id}`,
        category: "VOLUNTEER",
        title: volunteer.name || "Volunteer",
        subtitle: `${volunteer.skill || "General Volunteer"}${barangay}`,
        meta: volunteer.teamName ? `Team: ${volunteer.teamName}` : "Community Volunteer",
        badge: {
          label: String(volunteer.status || "OFFLINE").toUpperCase(),
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
    ...navItems,
  ];
}

/**
 * Perform ranked keyword scoring on an item against search tokens
 */
export function scoreSearchItem(item: SearchResultItem, tokens: string[]): number {
  if (tokens.length === 0) return 1;

  let totalScore = 0;
  const title = item.title.toLowerCase();
  const subtitle = item.subtitle.toLowerCase();
  const meta = (item.meta ?? "").toLowerCase();
  const badge = (item.badge?.label ?? "").toLowerCase();

  for (const token of tokens) {
    let tokenScore = 0;

    // Exact full title match
    if (title === token) {
      tokenScore += 100;
    } else if (title.startsWith(token)) {
      tokenScore += 60;
    } else if (title.includes(` ${token}`) || title.includes(`-${token}`)) {
      tokenScore += 45;
    } else if (title.includes(token)) {
      tokenScore += 30;
    }

    // Subtitle match (barangay, description, skills)
    if (subtitle.startsWith(token)) {
      tokenScore += 25;
    } else if (subtitle.includes(token)) {
      tokenScore += 15;
    }

    // Meta or badge match (e.g. "SOS", "fire", "available", "reports")
    if (badge.includes(token)) {
      tokenScore += 20;
    }
    if (meta.includes(token)) {
      tokenScore += 10;
    }

    // Token must match at least something to be valid
    if (tokenScore === 0) {
      return 0;
    }

    totalScore += tokenScore;
  }

  // Slight boost for emergency priority items
  if (item.category === "EMERGENCY") totalScore += 5;

  return totalScore;
}

/**
 * Filter and rank items based on search query and category filter
 */
export function filterAndRankItems(
  items: SearchResultItem[],
  query: string,
  category: SearchCategory
): SearchResultItem[] {
  const cleanQuery = query.trim().toLowerCase();
  const tokens = cleanQuery ? cleanQuery.split(/\s+/).filter(Boolean) : [];

  let pool = items;
  if (category !== "ALL") {
    pool = pool.filter((item) => item.category === category);
  }

  if (tokens.length === 0) {
    // When no query is typed, return curated recommendations
    return pool.slice(0, 15);
  }

  const scored = pool
    .map((item) => ({ item, score: scoreSearchItem(item, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((entry) => entry.item);
}
