export type Role = "SUPER_ADMIN" | "CDRRMO_ADMIN" | "LGU" | "VOLUNTEER" | "COMMUNITY";

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

export type LoginRequest = { email: string; password: string };
export type LoginResponse = { accessToken: string; refreshToken: string; role: Role };
