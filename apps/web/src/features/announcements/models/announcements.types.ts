export type AnnouncementStatus = "DRAFT" | "PUBLISHED";

export type AnnouncementAudience = "ALL" | "VOLUNTEER" | "LGU" | "PUBLIC";

export type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  publishedAt?: string | null; // ISO
};

export type AnnouncementDraftInput = {
  title: string;
  body: string;
  audience: AnnouncementAudience;
};

export type AnnouncementStatusFilter = "ALL" | AnnouncementStatus | "SCHEDULED" | "ARCHIVED";

export type AnnouncementFilters = {
  status: AnnouncementStatusFilter;
  audience: AnnouncementAudience | "";
  search: string;
};

export type AnnouncementStatistics = {
  total: number;
  published: number;
  drafts: number;
  scheduled: number | null;
};

export type AnnouncementTemplate = {
  id: string;
  title: string;
  description: string;
  body: string;
  audience: AnnouncementAudience;
  category: "FLOOD" | "VOLUNTEER" | "EVACUATION" | "WEATHER" | "SAFETY";
};
