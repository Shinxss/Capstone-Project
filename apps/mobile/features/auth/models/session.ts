export type AuthUser = {
  id: string;
  lifelineId?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  role?: string;
  volunteerStatus?: string;
  contactNo?: string;
  birthdate?: string;
  gender?: string;
  skills?: string;
  barangay?: string;
  municipality?: string;
  avatarUrl?: string;
  authProvider?: "local" | "google" | "both";
  emailVerified?: boolean;
  passwordSet?: boolean;
  googleLinked?: boolean;
  profileCompletionRequired?: boolean;
  missingProfileFields?: string[];
  accessToken: string;
};

export type Session =
  | { mode: "guest" }
  | { mode: "user"; user: AuthUser };
