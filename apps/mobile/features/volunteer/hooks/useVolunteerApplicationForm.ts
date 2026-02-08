import { useMemo, useState } from "react";
import { DEFAULT_CITY, DEFAULT_PROVINCE } from "../constants/volunteer.constants";
import { VolunteerApplicationInput } from "../models/volunteerApplication.model";
import { volunteerApplicationService } from "../services/volunteerApplication.service";
import {
  buildVolunteerSubmitPayload,
  validateVolunteerApplication,
} from "../utils/volunteerApplication.validators";

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

export function useVolunteerApplicationForm() {
  const [form, setForm] = useState<VolunteerApplicationInput>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

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
    submitting,
    error,

    errors,
    isValid,
    submitAttempted,

    submit,
  };
}
