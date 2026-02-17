import type { VerifiedAccessTokenPayload } from "../utils/jwt";

export {};

declare global {
  namespace Express {
    interface Request {
      auth?: VerifiedAccessTokenPayload;
      userId?: string;
      role?: string;
      user?: {
        id: string;
        role: string;
      };
    }
  }
}
