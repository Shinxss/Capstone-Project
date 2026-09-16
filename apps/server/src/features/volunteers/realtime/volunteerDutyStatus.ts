export type VolunteerDutyAccount = {
  role?: unknown;
  volunteerStatus?: unknown;
  isActive?: unknown;
};

export type VolunteerDutyEligibility =
  | { allowed: true }
  | { allowed: false; message: string };

export function evaluateVolunteerDutyEligibility(
  account: VolunteerDutyAccount | null | undefined
): VolunteerDutyEligibility {
  if (!account) {
    return { allowed: false, message: "Unable to verify this responder account." };
  }

  if (account.isActive === false) {
    return { allowed: false, message: "Your responder account is currently suspended." };
  }

  const role = String(account.role ?? "").trim().toUpperCase();
  if (role === "RESPONDER") return { allowed: true };

  const volunteerStatus = String(account.volunteerStatus ?? "").trim().toUpperCase();
  if (role === "VOLUNTEER" && volunteerStatus === "APPROVED") {
    return { allowed: true };
  }

  return { allowed: false, message: "This account cannot update responder availability." };
}
