import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import type { ChangePasswordInput, LguProfile, ProfileUpdateInput } from "../models/profile.types";
import { changePassword, getLocalProfile, refreshProfileToLocalStorage, updateProfile } from "../services/profile.service";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Email must be valid"),
  barangay: z.string().trim().optional(),
  municipality: z.string().trim().optional(),
  position: z.string().trim().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type ProfileFormErrors = Partial<Record<keyof ProfileUpdateInput, string>>;
export type PasswordFormErrors = Partial<Record<keyof ChangePasswordInput, string>>;

export function useLguProfile() {
  const [profile, setProfile] = useState<LguProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const local = getLocalProfile();
      setProfile(local);

      const maybeUpdated = await refreshProfileToLocalStorage();
      setProfile(maybeUpdated);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const validateProfile = useCallback((input: ProfileUpdateInput) => {
    const parsed = profileSchema.safeParse(input);
    if (parsed.success) return { ok: true as const, value: parsed.data, errors: {} as ProfileFormErrors };

    const errors: ProfileFormErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ProfileUpdateInput;
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false as const, value: input, errors };
  }, []);

  const saveProfile = useCallback(
    async (input: ProfileUpdateInput) => {
      const v = validateProfile(input);
      if (!v.ok) return v;

      setSaving(true);
      setSaveError(null);
      try {
        const updated = await updateProfile(v.value);
        setProfile(updated);
        return { ok: true as const, errors: {} as ProfileFormErrors };
      } catch (e: any) {
        setSaveError(e?.response?.data?.message || e?.message || "Failed to save profile");
        return { ok: false as const, errors: {} as ProfileFormErrors };
      } finally {
        setSaving(false);
      }
    },
    [validateProfile]
  );

  const validatePassword = useCallback((input: ChangePasswordInput) => {
    const parsed = passwordSchema.safeParse(input);
    if (parsed.success) return { ok: true as const, value: parsed.data, errors: {} as PasswordFormErrors };

    const errors: PasswordFormErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ChangePasswordInput;
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false as const, value: input, errors };
  }, []);

  const submitPasswordChange = useCallback(
    async (input: ChangePasswordInput) => {
      const v = validatePassword(input);
      if (!v.ok) return v;

      setPasswordBusy(true);
      setPasswordError(null);
      setPasswordSuccess(null);
      try {
        await changePassword({ currentPassword: v.value.currentPassword, newPassword: v.value.newPassword });
        setPasswordSuccess("Password updated.");
        return { ok: true as const, errors: {} as PasswordFormErrors };
      } catch (e: any) {
        setPasswordError(e?.response?.data?.message || e?.message || "Failed to change password");
        return { ok: false as const, errors: {} as PasswordFormErrors };
      } finally {
        setPasswordBusy(false);
      }
    },
    [validatePassword]
  );

  const displayName = useMemo(() => {
    if (!profile) return "Unknown";
    const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
    return name || profile.email || "User";
  }, [profile]);

  return {
    profile,
    displayName,
    loading,
    error,
    refresh,
    saving,
    saveError,
    saveProfile,
    validateProfile,
    passwordBusy,
    passwordError,
    passwordSuccess,
    submitPasswordChange,
    validatePassword,
  };
}

