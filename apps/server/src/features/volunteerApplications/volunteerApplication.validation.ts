import { z } from "zod";

export const createVolunteerApplicationSchema = z.object({
  fullName: z.string().min(2),
  sex: z.enum(["Male", "Female", "Prefer not to say"]),
  birthdate: z.string().min(8),

  mobile: z.string().min(7),
  email: z.string().email().optional().or(z.literal("")).optional(),

  street: z.string().optional(),
  barangay: z.string().min(2),
  city: z.string().optional(),
  province: z.string().optional(),

  emergencyContact: z.object({
    name: z.string().min(2),
    relationship: z.string().min(2),
    mobile: z.string().min(7),
    addressSameAsApplicant: z.boolean().optional(),
    address: z.string().optional(),
  }),

  skillsOther: z.string().optional(),
  certificationsText: z.string().optional(),
  availabilityText: z.string().optional(),
  preferredAssignmentText: z.string().optional(),
  healthNotes: z.string().optional(),

  consent: z.object({
    truth: z.boolean(),
    rules: z.boolean(),
    data: z.boolean(),
  }),
});

export const reviewVolunteerApplicationSchema = z.object({
  action: z.enum(["needs_info", "verified", "rejected"]),
  notes: z.string().optional(),
});
