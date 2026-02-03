export const AUTH_STORAGE_KEYS = {
  lguToken: "lifeline_lgu_token",
} as const;

export const AUTH_ROUTES = {
  lguAfterLogin: "/lgu/dashboard",
} as const;

export const AUTH_ENDPOINTS = {
  lguLogin: "/api/auth/lgu/login",
} as const;
