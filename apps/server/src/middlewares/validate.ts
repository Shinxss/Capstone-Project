import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

type Where = "body" | "query" | "params";

export function validate(schema: ZodSchema, where: Where = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const target = (req as any)[where];
    const result = schema.safeParse(target);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: result.error.flatten(),
      });
    }
    if (where === "query") {
      Object.assign(req.query as any, result.data);
    } else if (where === "params") {
      Object.assign(req.params as any, result.data);
    } else {
      // body is safe to replace
      (req as any).body = result.data;
    }

    next();
  };
}
