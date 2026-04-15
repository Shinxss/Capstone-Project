import { z } from "zod";
import { zodPasswordSchema } from "./password.policy";

export const communityRegisterSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.string().trim().email("Invalid email"),
    password: zodPasswordSchema(),
  })
  .strict();

export const communityLoginSchema = z
  .object({
    identifier: z.string().trim().min(1, "Email or username is required").optional(),
    email: z.string().trim().min(1, "Email or username is required").optional(),
    password: z.string().min(1, "Password is required"),
  })
  .superRefine((value, ctx) => {
    const candidate = String(value.identifier ?? value.email ?? "").trim();
    if (!candidate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email or username is required",
        path: ["identifier"],
      });
    }
  })
  .strict();

export const lguLoginSchema = z
  .object({
    username: z.string().trim().min(1, "username is required"),
    password: z.string().min(1, "password is required"),
  })
  .strict();
