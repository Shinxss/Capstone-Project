import type { VerifiedAccessTokenPayload } from "../utils/jwt";

export {};

declare global {
  namespace Express {
    interface Request {
      auth?: VerifiedAccessTokenPayload;
      userId?: string;
      role?: string;
      adminTier?: "SUPER" | "CDRRMO";
      roleKey?: "SUPER_ADMIN" | "CDRRMO_ADMIN" | "LGU_ADMIN";
      permissions?: string[];
      requestId?: string;
      correlationId?: string;
      clientContext?: {
        ip?: string;
        userAgent?: string;
        origin?: string;
      };
      user?: {
        id: string;
        role: string;
      };
    }
  }
}
