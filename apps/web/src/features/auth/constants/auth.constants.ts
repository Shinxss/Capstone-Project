export const AUTH_STORAGE_KEYS = {
  lguToken: "lifeline_lgu_token", // OK for both LGU + ADMIN for now
  lguUser: "lifeline_lgu_user",
} as const;

export const AUTH_ROUTES = {
  lguAfterLogin: "/lgu/dashboard",
  adminAfterLogin: "/lgu/dashboard", // ✅ change later when you build admin pages
} as const;

export const AUTH_ENDPOINTS = {
  lguLogin: "/api/auth/lgu/login",
  adminMfaVerify: "/api/auth/admin/mfa/verify",
  logout: "/api/auth/logout",
} as const;
