import { Router } from "express";
import type { Request, Response } from "express";
import { generateCsrfToken } from "../../middlewares/csrf";

const router = Router();

/**
 * GET /api/security/csrf
 * Returns a CSRF token for the calling browser client.
 * Also sets the double-submit CSRF cookie automatically.
 */
router.get("/csrf", (req: Request, res: Response) => {
  const token = generateCsrfToken(req, res);
  res.json({ csrfToken: token });
});

export default router;
