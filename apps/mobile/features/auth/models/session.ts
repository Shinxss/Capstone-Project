export type AuthUser = {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  role?: string;
  volunteerStatus?: string;
  authProvider?: "local" | "google" | "both";
  emailVerified?: boolean;
  passwordSet?: boolean;
  googleLinked?: boolean;
  accessToken: string;
};

export type Session =
  | { mode: "guest" }
  | { mode: "user"; user: AuthUser };
