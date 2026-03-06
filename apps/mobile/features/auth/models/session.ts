export type AuthUser = {
  id: string;
  lifelineId?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  role?: string;
  volunteerStatus?: string;
  contactNo?: string;
  barangay?: string;
  municipality?: string;
  avatarUrl?: string;
  authProvider?: "local" | "google" | "both";
  emailVerified?: boolean;
  passwordSet?: boolean;
  googleLinked?: boolean;
  accessToken: string;
};

export type Session =
  | { mode: "guest" }
  | { mode: "user"; user: AuthUser };
