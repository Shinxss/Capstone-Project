export type AuthUser = {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  role?: string;
};

export type Session =
  | { mode: "guest" }
  | { mode: "user"; user: AuthUser };
