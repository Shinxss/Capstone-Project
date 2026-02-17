export type AuthUser = {
  id: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  volunteerStatus?: string;
  authProvider?: "local" | "google" | "both";
  emailVerified?: boolean;
  passwordSet?: boolean;
  googleLinked?: boolean;
};
