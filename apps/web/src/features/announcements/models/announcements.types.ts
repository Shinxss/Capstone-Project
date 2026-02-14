export type AnnouncementStatus = "DRAFT" | "PUBLISHED";

export type AnnouncementAudience = "ALL" | "VOLUNTEERS" | "LGU" | "BARANGAY";

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

