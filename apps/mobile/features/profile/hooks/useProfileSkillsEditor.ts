import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "../../auth/hooks/useSession";
import { isDispatchAssigneeRole, normalizeStringValue } from "../models/profile";
import { getMyProfile, getProfileSkillOptions, updateMyProfile } from "../services/profileApi";
import { composeSkillsText, normalizeSkillOptions, parseSkillState } from "../utils/skills";

function applySessionPatchValue(value: string) {
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function normalizeSignature(selectedSkills: string[], otherSkillEnabled: boolean, otherSkillText: string) {
  const normalizedSelected = Array.from(new Set(selectedSkills.map((value) => value.trim()).filter(Boolean))).sort();
  const normalizedOther = otherSkillEnabled ? otherSkillText.trim() : "";
  return JSON.stringify({
    selectedSkills: normalizedSelected,
    otherSkillEnabled: Boolean(otherSkillEnabled),
    otherSkillText: normalizedOther,
  });
}

export function useProfileSkillsEditor() {
  const { session, isUser, updateUser } = useSession();
  const sessionUser = session?.mode === "user" ? session.user : null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillOptions, setSkillOptions] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [otherSkillEnabled, setOtherSkillEnabled] = useState(false);
  const [otherSkillText, setOtherSkillText] = useState("");
  const [initialSignature, setInitialSignature] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");

  const canEdit = useMemo(
    () => isDispatchAssigneeRole(role || sessionUser?.role),
    [role, sessionUser?.role]
  );

  const refresh = useCallback(async () => {
    if (!isUser) {
      setError("Sign in required.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [profile, optionsFromServer] = await Promise.all([
        getMyProfile(),
        getProfileSkillOptions().catch(() => []),
      ]);

      const options = normalizeSkillOptions(optionsFromServer);
      const parsed = parseSkillState(normalizeStringValue(profile.skills), options);

      setSkillOptions(options);
      setSelectedSkills(parsed.selectedSkills);
      setOtherSkillEnabled(parsed.otherSkillEnabled);
      setOtherSkillText(parsed.otherSkillText);
      setInitialSignature(
        normalizeSignature(parsed.selectedSkills, parsed.otherSkillEnabled, parsed.otherSkillText)
      );
      setFirstName(normalizeStringValue(profile.firstName) || normalizeStringValue(sessionUser?.firstName));
      setLastName(normalizeStringValue(profile.lastName) || normalizeStringValue(sessionUser?.lastName));
      setRole(normalizeStringValue(profile.role));
    } catch (err: any) {
      setError(String(err?.response?.data?.message ?? err?.message ?? "Failed to load skills."));
    } finally {
      setLoading(false);
    }
  }, [isUser, sessionUser?.firstName, sessionUser?.lastName]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleSkill = useCallback((skill: string) => {
    setSelectedSkills((prev) => (prev.includes(skill) ? prev.filter((item) => item !== skill) : [...prev, skill]));
    setError(null);
  }, []);

  const toggleOtherSkillEnabled = useCallback(() => {
    setOtherSkillEnabled((prev) => {
      const next = !prev;
      if (!next) {
        setOtherSkillText("");
      }
      return next;
    });
    setError(null);
  }, []);

  const setOtherSkill = useCallback((value: string) => {
    setOtherSkillText(value);
    setError(null);
  }, []);

  const currentSkills = useMemo(
    () => composeSkillsText(selectedSkills, otherSkillEnabled, otherSkillText),
    [otherSkillEnabled, otherSkillText, selectedSkills]
  );

  const currentSignature = useMemo(
    () => normalizeSignature(selectedSkills, otherSkillEnabled, otherSkillText),
    [otherSkillEnabled, otherSkillText, selectedSkills]
  );

  const hasChanges = currentSignature !== initialSignature;

  const save = useCallback(async () => {
    if (!isUser || !canEdit || saving) return false;

    if (otherSkillEnabled && !otherSkillText.trim()) {
      setError("Please enter your other skill.");
      return false;
    }

    const safeFirstName = firstName.trim();
    const safeLastName = lastName.trim();
    if (!safeFirstName || !safeLastName) {
      setError("Profile name is required before saving skills.");
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await updateMyProfile({
        firstName: safeFirstName,
        lastName: safeLastName,
        skills: currentSkills || undefined,
      });

      const refreshedOptions = normalizeSkillOptions(
        await getProfileSkillOptions().catch(() => skillOptions)
      );
      const parsed = parseSkillState(normalizeStringValue(updated.skills), refreshedOptions);

      setSkillOptions(refreshedOptions);
      setSelectedSkills(parsed.selectedSkills);
      setOtherSkillEnabled(parsed.otherSkillEnabled);
      setOtherSkillText(parsed.otherSkillText);
      setInitialSignature(
        normalizeSignature(parsed.selectedSkills, parsed.otherSkillEnabled, parsed.otherSkillText)
      );

      await updateUser({
        firstName: updated.firstName,
        lastName: applySessionPatchValue(updated.lastName),
        skills: applySessionPatchValue(updated.skills),
      });

      return true;
    } catch (err: any) {
      setError(String(err?.response?.data?.message ?? err?.message ?? "Failed to save skills."));
      return false;
    } finally {
      setSaving(false);
    }
  }, [canEdit, currentSkills, firstName, isUser, lastName, otherSkillEnabled, otherSkillText, saving, skillOptions, updateUser]);

  return {
    loading,
    saving,
    error,
    canEdit,
    hasChanges,
    skillOptions,
    selectedSkills,
    otherSkillEnabled,
    otherSkillText,
    currentSkills,
    toggleSkill,
    toggleOtherSkillEnabled,
    setOtherSkill,
    refresh,
    save,
  };
}
