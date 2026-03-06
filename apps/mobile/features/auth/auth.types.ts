export type AuthUser = {
  id: string;
  lifelineId?: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  volunteerStatus?: string;
  contactNo?: string;
  barangay?: string;
  municipality?: string;
  avatarUrl?: string;
  authProvider?: "local" | "google" | "both";
  emailVerified?: boolean;
  passwordSet?: boolean;
  googleLinked?: boolean;
};
