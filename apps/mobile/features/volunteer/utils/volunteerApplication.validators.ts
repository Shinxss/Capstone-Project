import type { VolunteerApplicationInput, Sex } from "../models/volunteerApplication.model";

export type VolunteerFieldKey =
  | "fullName"
  | "sex"
  | "birthdate"
  | "mobile"
  | "email"
  | "barangay"
  | "emergencyContact.name"
  | "emergencyContact.relationship"
  | "emergencyContact.mobile"
  | "consent.truth"
  | "consent.rules"
  | "consent.data";

export type VolunteerValidationErrors = Partial<Record<VolunteerFieldKey, string>>;

function isBlank(v?: string | null) {
  return !v || !v.trim();
}

export function normalizeSex(input: string): Sex | null {
  const v = input.trim().toLowerCase();
  if (v === "male") return "Male";
  if (v === "female") return "Female";
  if (v === "prefer not to say" || v === "prefer not say" || v === "prefer") return "Prefer not to say";
  return null;
}

export function isValidISODate(dateStr: string) {
  // YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + "T00:00:00.000Z");
  if (Number.isNaN(d.getTime())) return false;
  // Ensure it doesn't normalize to different date (e.g., 2026-02-31)
  const [y, m, day] = dateStr.split("-").map(Number);
  return d.getUTCFullYear() === y && d.getUTCMonth() + 1 === m && d.getUTCDate() === day;
}

export function isFutureISODate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00.000Z");
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  return d.getTime() > todayUTC.getTime();
}

export function isValidEmail(email: string) {
  // simple + safe
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function normalizePHMobile(input: string) {
  const raw = input.trim().replace(/\s|-/g, "");
  if (raw.startsWith("+63")) return "0" + raw.slice(3);
  return raw;
}

export function isValidPHMobile(input: string) {
  const v = normalizePHMobile(input);
  // PH mobile usually 11 digits starting 09
  return /^09\d{9}$/.test(v);
}

export function validateVolunteerApplication(form: VolunteerApplicationInput) {
  const errors: VolunteerValidationErrors = {};

  // Required text
  if (isBlank(form.fullName)) errors["fullName"] = "Full name is required.";
  else if (form.fullName.trim().length < 2) errors["fullName"] = "Full name is too short.";

  // Sex (we accept case-insensitive typing but must normalize)
  if (isBlank(String(form.sex))) errors["sex"] = "Sex is required.";
  else if (!normalizeSex(String(form.sex))) errors["sex"] = "Use: Male, Female, or Prefer not to say.";

  // Birthdate
  if (isBlank(form.birthdate)) errors["birthdate"] = "Birthdate is required.";
  else if (!isValidISODate(form.birthdate)) errors["birthdate"] = "Use format YYYY-MM-DD.";
  else if (isFutureISODate(form.birthdate)) errors["birthdate"] = "Birthdate cannot be in the future.";

  // Mobile
  if (isBlank(form.mobile)) errors["mobile"] = "Mobile number is required.";
  else if (!isValidPHMobile(form.mobile)) errors["mobile"] = "Enter a valid PH mobile (09XXXXXXXXX).";

  // Email optional
  if (!isBlank(form.email ?? "") && !isValidEmail(form.email!)) {
    errors["email"] = "Enter a valid email address.";
  }

  // Barangay
  if (isBlank(form.barangay)) errors["barangay"] = "Barangay is required.";

  // Emergency contact
  if (isBlank(form.emergencyContact?.name)) errors["emergencyContact.name"] = "Emergency contact name is required.";
  if (isBlank(form.emergencyContact?.relationship))
    errors["emergencyContact.relationship"] = "Relationship is required.";
  if (isBlank(form.emergencyContact?.mobile))
    errors["emergencyContact.mobile"] = "Emergency contact number is required.";
  else if (!isValidPHMobile(form.emergencyContact.mobile))
    errors["emergencyContact.mobile"] = "Enter a valid PH mobile (09XXXXXXXXX).";

  // Consents
  if (!form.consent.truth) errors["consent.truth"] = "Required.";
  if (!form.consent.rules) errors["consent.rules"] = "Required.";
  if (!form.consent.data) errors["consent.data"] = "Required.";

  const isValid = Object.keys(errors).length === 0;

  return { isValid, errors };
}

export function buildVolunteerSubmitPayload(form: VolunteerApplicationInput): VolunteerApplicationInput {
  const sex = normalizeSex(String(form.sex)) ?? (form.sex as any);

  return {
    ...form,
    fullName: form.fullName.trim(),
    sex,
    birthdate: form.birthdate.trim(),
    mobile: normalizePHMobile(form.mobile),
    email: (form.email ?? "").trim().toLowerCase(),
    street: (form.street ?? "").trim(),
    barangay: form.barangay.trim(),
    city: (form.city ?? "").trim(),
    province: (form.province ?? "").trim(),
    emergencyContact: {
      ...form.emergencyContact,
      name: form.emergencyContact.name.trim(),
      relationship: form.emergencyContact.relationship.trim(),
      mobile: normalizePHMobile(form.emergencyContact.mobile),
      address: (form.emergencyContact.address ?? "").trim(),
    },
    skillsOther: (form.skillsOther ?? "").trim(),
    certificationsText: (form.certificationsText ?? "").trim(),
    availabilityText: (form.availabilityText ?? "").trim(),
    preferredAssignmentText: (form.preferredAssignmentText ?? "").trim(),
    healthNotes: (form.healthNotes ?? "").trim(),
  };
}
