export type AdminAnnouncementAudience = "LGU" | "VOLUNTEER" | "PUBLIC" | "ALL";
export type AdminAnnouncementStatus = "DRAFT" | "PUBLISHED";

export type AdminAnnouncement = {
  id: string;
  title: string;
  body: string;
  audience: AdminAnnouncementAudience;
  status: AdminAnnouncementStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  } | null;
};

export type AdminAnnouncementDraftInput = {
  title: string;
  body: string;
  audience: AdminAnnouncementAudience;
  status?: AdminAnnouncementStatus;
};
