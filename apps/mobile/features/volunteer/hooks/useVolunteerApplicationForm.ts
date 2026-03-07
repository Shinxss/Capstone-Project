import { useEffect, useMemo, useState } from "react";
import { DEFAULT_CITY, DEFAULT_PROVINCE } from "../constants/volunteer.constants";
import { VolunteerApplicationInput } from "../models/volunteerApplication.model";
import { volunteerApplicationService } from "../services/volunteerApplication.service";
import {
  buildVolunteerSubmitPayload,
  validateVolunteerApplication,
} from "../utils/volunteerApplication.validators";
import { useSession } from "../../auth/hooks/useSession";
import { getProfileSkillOptions } from "../../profile/services/profileApi";
import { normalizeSkillOptions } from "../../profile/utils/skills";

// ✅ define initial state (this fixes "Cannot find name 'initial'")
const initial: VolunteerApplicationInput = {
  fullName: "",
  sex: "",
  birthdate: "",

  mobile: "",
  email: "",

  street: "",
  barangay: "",
  city: DEFAULT_CITY,
  province: DEFAULT_PROVINCE,

  emergencyContact: {
    name: "",
    relationship: "",
    mobile: "",
    addressSameAsApplicant: true,
    address: "",
  },

  skillsOther: "",
  certificationsText: "",
  availabilityText: "",
  preferredAssignmentText: "",
  healthNotes: "",

  consent: { truth: false, rules: false, data: false },
};

function normalizeSexInput(value?: string | null): VolunteerApplicationInput["sex"] {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (normalized === "male") return "Male";
  if (normalized === "female") return "Female";
  if (
    normalized === "prefer not to say" ||
    normalized === "prefer not say" ||
    normalized === "prefer"
  ) {
    return "Prefer not to say";
  }

  return "";
}

function buildPrefilledForm(user?: {
  firstName?: string;
  lastName?: string;
  email?: string;
  contactNo?: string;
  birthdate?: string;
  gender?: string;
  skills?: string;
  barangay?: string;
  municipality?: string;
} | null): VolunteerApplicationInput {
  const fullName = [user?.firstName ?? "", user?.lastName ?? ""]
    .join(" ")
    .trim();

  return {
    ...initial,
    fullName,
    sex: normalizeSexInput(user?.gender),
    birthdate: String(user?.birthdate ?? "").trim(),
    mobile: String(user?.contactNo ?? "").trim(),
    email: String(user?.email ?? "").trim(),
    barangay: String(user?.barangay ?? "").trim(),
    city: String(user?.municipality ?? "").trim() || DEFAULT_CITY,
    skillsOther: String(user?.skills ?? "").trim(),
  };
}

export function useVolunteerApplicationForm() {
  const { session } = useSession();
  const sessionUser = session?.mode === "user" ? session.user : null;

  const [form, setForm] = useState<VolunteerApplicationInput>(() =>
    buildPrefilledForm(sessionUser)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [skillOptions, setSkillOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!sessionUser) return;

    const next = buildPrefilledForm(sessionUser);

    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName.trim() ? prev.fullName : next.fullName,
      sex: prev.sex || next.sex,
      birthdate: prev.birthdate.trim() ? prev.birthdate : next.birthdate,
      mobile: prev.mobile.trim() ? prev.mobile : next.mobile,
      email: prev.email?.trim() ? prev.email : next.email,
      barangay: prev.barangay.trim() ? prev.barangay : next.barangay,
      city: prev.city?.trim() ? prev.city : next.city,
      skillsOther: prev.skillsOther?.trim() ? prev.skillsOther : next.skillsOther,
    }));
  }, [sessionUser]);

  useEffect(() => {
    let cancelled = false;

    if (!sessionUser) {
      setSkillOptions([]);
      return;
    }

    (async () => {
      try {
        const options = await getProfileSkillOptions();
        if (cancelled) return;
        setSkillOptions(normalizeSkillOptions(options));
      } catch {
        if (cancelled) return;
        setSkillOptions([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionUser?.id]);

  const validation = useMemo(() => validateVolunteerApplication(form), [form]);

  // ✅ make sure you use the correct casing
  const errors = validation.errors;
  const isValid = validation.isValid;

  async function submit() {
    setError(null);

    // ✅ FIX: should be !isValid
    if (!isValid) {
      setSubmitAttempted(true);
      return { ok: false as const, reason: "validation" as const, errors };
    }

    try {
      setSubmitting(true);

      const payload = buildVolunteerSubmitPayload(form);
      const created = await volunteerApplicationService.submit(payload);

      return { ok: true as const, created };
    } catch (e: any) {
      const message =
        e?.response?.data?.message || "Submit failed. Please try again.";
      setError(message);
      return { ok: false as const, reason: "api_error" as const, message };
    } finally {
      setSubmitting(false);
    }
  }

  return {
    form,
    setForm,
    skillOptions,
    submitting,
    error,

    errors,
    isValid,
    submitAttempted,

    submit,
  };
}
