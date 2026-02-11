export {};

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      role?: string;
      user?: {
        id: string;
        role: string;
      };
    }
  }
}
