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
    email: z.string().trim().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export const lguLoginSchema = z
  .object({
    username: z.string().trim().min(1, "username is required"),
    password: z.string().min(1, "password is required"),
  })
  .strict();
