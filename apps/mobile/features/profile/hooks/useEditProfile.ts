import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "../../auth/hooks/useSession";
import {
  buildEditableProfilePayload,
  editableProfileFromUser,
  formatProfileRoleLabel,
  isApprovedVolunteer,
  isVolunteerRole,
  normalizeStringValue,
  type EditableProfile,
  type EditableProfileFields,
  type ProfileGender,
} from "../models/profile";
import { getMyProfile, getProfileSummary, updateMyProfile } from "../services/profileApi";

type EditProfileFieldKey = keyof EditableProfileFields;

export type EditProfileFieldErrors = Partial<Record<EditProfileFieldKey, string>>;

const BIRTHDATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const CONTACT_NO_REGEX = /^[+0-9][0-9+\-()\s]{6,19}$/;
const ALLOWED_GENDERS: ProfileGender[] = ["Male", "Female", "Prefer not to say"];

function normalizeForCompare(fields: EditableProfileFields): EditableProfileFields {
  return {
    firstName: fields.firstName.trim(),
    lastName: fields.lastName.trim(),
    contactNo: fields.contactNo.trim(),
    birthdate: fields.birthdate.trim(),
    barangay: fields.barangay.trim(),
    gender: fields.gender.trim(),
    skills: fields.skills.trim(),
  };
}

function fieldsFromProfile(profile: EditableProfile): EditableProfileFields {
  return {
    firstName: normalizeStringValue(profile.firstName),
    lastName: normalizeStringValue(profile.lastName),
    contactNo: normalizeStringValue(profile.contactNo),
    birthdate: normalizeStringValue(profile.birthdate),
    barangay: normalizeStringValue(profile.barangay),
    gender: normalizeStringValue(profile.gender),
    skills: normalizeStringValue(profile.skills),
  };
}

function isValidIsoDate(value: string) {
  if (!BIRTHDATE_REGEX.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime())) return false;
  return parsed.toISOString().slice(0, 10) === value;
}

function validateProfileFields(fields: EditableProfileFields): EditProfileFieldErrors {
  const errors: EditProfileFieldErrors = {};

  const firstName = fields.firstName.trim();
  if (!firstName) errors.firstName = "First name is required.";
  else if (firstName.length > 100) errors.firstName = "First name must be 100 characters or less.";

  const lastName = fields.lastName.trim();
  if (!lastName) errors.lastName = "Last name is required.";
  else if (lastName.length > 100) errors.lastName = "Last name must be 100 characters or less.";

  const contactNo = fields.contactNo.trim();
  if (contactNo && !CONTACT_NO_REGEX.test(contactNo)) {
    errors.contactNo = "Enter a valid contact number.";
  }

  const birthdate = fields.birthdate.trim();
  if (birthdate && !isValidIsoDate(birthdate)) {
    errors.birthdate = "Birthdate must be YYYY-MM-DD.";
  }

  const barangay = fields.barangay.trim();
  if (barangay.length > 200) {
    errors.barangay = "Barangay must be 200 characters or less.";
  }

  const gender = fields.gender.trim();
  if (gender && !ALLOWED_GENDERS.includes(gender as ProfileGender)) {
    errors.gender = "Select a valid gender.";
  }

  return errors;
}

function applySessionPatchValue(value: string) {
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

export function useEditProfile() {
  const { session, isUser, updateUser } = useSession();
  const sessionUser = session?.mode === "user" ? session.user : null;

  const sessionProfile = useMemo(() => editableProfileFromUser(sessionUser), [sessionUser]);

  const [profile, setProfile] = useState<EditableProfile>(sessionProfile);
  const [fields, setFields] = useState<EditableProfileFields>(fieldsFromProfile(sessionProfile));
  const [initialFields, setInitialFields] = useState<EditableProfileFields>(fieldsFromProfile(sessionProfile));
  const [errors, setErrors] = useState<EditProfileFieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canEditSkills = useMemo(() => isVolunteerRole(profile.role), [profile.role]);

  const refresh = useCallback(async () => {
    if (!isUser) {
      setProfile(sessionProfile);
      const fallbackFields = fieldsFromProfile(sessionProfile);
      setFields(fallbackFields);
      setInitialFields(fallbackFields);
      setErrors({});
      setLoadError("Sign in required.");
      setSaveError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    setSaveError(null);

    try {
      const remoteProfile = await getMyProfile();
      const summary = await getProfileSummary().catch(() => null);

      const mergedProfile: EditableProfile = {
        ...remoteProfile,
        contactNo: normalizeStringValue(remoteProfile.contactNo) || normalizeStringValue(summary?.contactNo) || "",
        birthdate: normalizeStringValue(remoteProfile.birthdate) || normalizeStringValue(summary?.birthdate) || "",
        barangay: normalizeStringValue(remoteProfile.barangay) || normalizeStringValue(summary?.barangay) || "",
      };

      const remoteFields = fieldsFromProfile(mergedProfile);
      setProfile(mergedProfile);
      setFields(remoteFields);
      setInitialFields(remoteFields);
      setErrors({});
    } catch (error: any) {
      const fallbackFields = fieldsFromProfile(sessionProfile);
      setProfile(sessionProfile);
      setFields(fallbackFields);
      setInitialFields(fallbackFields);
      setErrors({});
      setLoadError(String(error?.response?.data?.message ?? error?.message ?? "Failed to load profile."));
    } finally {
      setLoading(false);
    }
  }, [isUser, sessionProfile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setField = useCallback((key: EditProfileFieldKey, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSaveError(null);
  }, []);

  const hasUnsavedChanges = useMemo(() => {
    const current = normalizeForCompare(fields);
    const baseline = normalizeForCompare(initialFields);
    return (Object.keys(current) as EditProfileFieldKey[]).some((key) => current[key] !== baseline[key]);
  }, [fields, initialFields]);

  const save = useCallback(async () => {
    if (!isUser || saving) return false;

    const validationErrors = validateProfileFields(fields);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return false;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const payload = buildEditableProfilePayload({
        ...fields,
        // Skills are edited in dedicated /profile/skills page.
        skills: "",
      });
      const updatedProfile = await updateMyProfile(payload);
      const updatedFields = fieldsFromProfile(updatedProfile);

      setProfile(updatedProfile);
      setFields(updatedFields);
      setInitialFields(updatedFields);
      setErrors({});

      await updateUser({
        id: updatedProfile.id,
        lifelineId: applySessionPatchValue(updatedProfile.lifelineId ?? ""),
        firstName: updatedProfile.firstName,
        lastName: applySessionPatchValue(updatedProfile.lastName),
        email: applySessionPatchValue(updatedProfile.email ?? ""),
        role: applySessionPatchValue(updatedProfile.role),
        volunteerStatus: applySessionPatchValue(updatedProfile.volunteerStatus ?? ""),
        contactNo: applySessionPatchValue(updatedProfile.contactNo),
        birthdate: applySessionPatchValue(updatedProfile.birthdate),
        barangay: applySessionPatchValue(updatedProfile.barangay),
        gender: applySessionPatchValue(updatedProfile.gender),
        skills: applySessionPatchValue(updatedProfile.skills),
        avatarUrl: applySessionPatchValue(updatedProfile.avatarUrl ?? ""),
      });

      return true;
    } catch (error: any) {
      setSaveError(String(error?.response?.data?.message ?? error?.message ?? "Failed to save profile."));
      return false;
    } finally {
      setSaving(false);
    }
  }, [fields, isUser, saving, updateUser]);

  const fullName = useMemo(() => {
    const combined = [fields.firstName.trim(), fields.lastName.trim()].filter(Boolean).join(" ").trim();
    return combined || sessionUser?.email || "User";
  }, [fields.firstName, fields.lastName, sessionUser?.email]);

  return {
    loading,
    saving,
    loadError,
    saveError,
    profile,
    fields,
    errors,
    canEditSkills,
    hasUnsavedChanges,
    canSave: hasUnsavedChanges && !saving,
    display: {
      fullName,
      roleLabel: formatProfileRoleLabel(profile.role),
      showVerified: isApprovedVolunteer(profile.role, profile.volunteerStatus),
    },
    setField,
    refresh,
    save,
  };
}
