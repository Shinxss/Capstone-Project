export type PortalUserRole = "ADMIN" | "LGU" | "VOLUNTEER" | "COMMUNITY";
export type PortalAdminTier = "SUPER" | "CDRRMO";

export type AdminUserItem = {
  id: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: PortalUserRole;
  adminTier?: PortalAdminTier;
  lguName?: string;
  lguPosition?: string;
  barangay?: string;
  municipality?: string;
  volunteerStatus?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminUsersListResponse = {
  items: AdminUserItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
