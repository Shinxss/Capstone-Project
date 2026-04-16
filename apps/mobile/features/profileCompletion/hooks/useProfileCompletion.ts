import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../auth/AuthProvider";
import { getErrorMessage } from "../../auth/utils/authErrors";
import {
  buildProfileCompletionPayload,
  formatDagupanAddress,
  getInitialProfileCompletionValues,
  hasValidationErrors,
  resolveProfileCompletionNameVisibility,
  validateProfileCompletionValues,
  type ProfileCompletionField,
  type ProfileCompletionFormValues,
} from "../models/profileCompletion";
import { completeMyProfile } from "../services/profileCompletionApi";

export function useProfileCompletion() {
  const router = useRouter();
  const { user, token, setAuthed, signInWithToken, signOut } = useAuth();

  const [values, setValues] = useState<ProfileCompletionFormValues>(() => getInitialProfileCompletionValues(user));
  const [touchedFields, setTouchedFields] = useState<Partial<Record<ProfileCompletionField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    setValues(getInitialProfileCompletionValues(user));
    setTouchedFields({});
    setSubmitAttempted(false);
    setServerError(null);
  }, [user?.id]);

  const nameVisibility = useMemo(() => resolveProfileCompletionNameVisibility(user), [user]);
  const validationErrors = useMemo(
    () => validateProfileCompletionValues(values, nameVisibility),
    [nameVisibility, values]
  );

  const errors = useMemo(() => {
    if (submitAttempted) return validationErrors;

    const nextErrors: typeof validationErrors = {};
    (Object.keys(validationErrors) as ProfileCompletionField[]).forEach((field) => {
      if (touchedFields[field]) {
        const message = validationErrors[field];
        if (message) {
          nextErrors[field] = message;
        }
      }
    });

    return nextErrors;
  }, [submitAttempted, touchedFields, validationErrors]);

  const canSubmit = useMemo(() => {
    if (submitting || !user || !token) return false;
    return !hasValidationErrors(validationErrors);
  }, [submitting, token, user, validationErrors]);

  const addressDisplay = useMemo(() => formatDagupanAddress(values.barangay), [values.barangay]);

  const setFieldValue = useCallback((field: ProfileCompletionField, value: string) => {
    setValues((previous) => ({
      ...previous,
      [field]: value,
    }));
    setTouchedFields((previous) => ({ ...previous, [field]: true }));

    setServerError(null);
  }, []);

  const submit = useCallback(async () => {
    if (submitting || !user || !token) return false;
    setSubmitAttempted(true);

    if (hasValidationErrors(validationErrors)) {
      return false;
    }

    setSubmitting(true);
    setServerError(null);

    try {
      const payload = buildProfileCompletionPayload(values, nameVisibility);
      const result = await completeMyProfile(payload);

      const fallbackFirstName = values.firstName.trim() || user.firstName;
      const fallbackLastName = values.lastName.trim() || user.lastName;

      await setAuthed(token, {
        ...user,
        ...result.user,
        firstName: result.user.firstName ?? fallbackFirstName,
        lastName: result.user.lastName ?? fallbackLastName,
        contactNo: result.user.contactNo ?? payload.contactNo,
        gender: result.user.gender ?? payload.gender,
        barangay: result.user.barangay ?? payload.barangay,
        municipality: result.user.municipality ?? "Dagupan City",
        profileCompletionRequired: false,
        missingProfileFields: [],
      });

      await signInWithToken(token);
      router.replace("/(tabs)");
      return true;
    } catch (error) {
      setServerError(getErrorMessage(error, "Failed to complete profile."));
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [nameVisibility, router, setAuthed, signInWithToken, submitting, token, user, validationErrors, values]);

  const logout = useCallback(async () => {
    if (submitting) return;
    await signOut();
  }, [signOut, submitting]);

  return {
    values,
    errors,
    submitting,
    serverError,
    canSubmit,
    showFirstName: nameVisibility.showFirstName,
    showLastName: nameVisibility.showLastName,
    addressDisplay,
    setFieldValue,
    submit,
    logout,
  };
}
