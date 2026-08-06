import type { Announcement, AnnouncementAudience, AnnouncementFilters, AnnouncementStatusFilter } from "../models/announcements.types";

export function audienceLabel(audience: AnnouncementAudience) {
  switch (audience) {
    case "LGU": return "LGU Officials";
    case "VOLUNTEER": return "Volunteers";
    case "PUBLIC": return "Community Members";
    default: return "Everyone";
  }
}

export function parseAudience(value: string): AnnouncementAudience | "" {
  switch (value) {
    case "LGU":
    case "VOLUNTEER":
    case "PUBLIC":
    case "ALL":
      return value;
    default:
      return "";
  }
}

export function parseStatusFilter(value: string): AnnouncementStatusFilter {
  switch (value) {
    case "PUBLISHED":
    case "DRAFT":
    case "SCHEDULED":
    case "ARCHIVED":
      return value;
    default:
      return "ALL";
  }
}

export function filterAnnouncements(items: Announcement[], filters: AnnouncementFilters) {
  const query = filters.search.trim().toLocaleLowerCase();
  return items.filter((item) => {
    if (filters.status === "SCHEDULED" || filters.status === "ARCHIVED") return false;
    if (filters.status !== "ALL" && item.status !== filters.status) return false;
    if (filters.audience && item.audience !== filters.audience) return false;
    if (query && !`${item.title} ${item.body}`.toLocaleLowerCase().includes(query)) return false;
    return true;
  });
}

export function hasAnnouncementFilters(filters: AnnouncementFilters) {
  return filters.status !== "ALL" || filters.audience !== "" || filters.search.trim().length > 0;
}

export function formatAnnouncementDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function announcementPreview(body?: string | null) {
  const normalized = body?.trim();
  if (!normalized) return "No content preview available.";
  return normalized.length > 180 ? `${normalized.slice(0, 180).trimEnd()}…` : normalized;
}
