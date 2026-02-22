import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import type { Announcement, AnnouncementAudience, AnnouncementDraftInput } from "../models/announcements.types";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  publishAnnouncement,
  seedAnnouncementsIfEmpty,
  unpublishAnnouncement,
  updateAnnouncement,
} from "../services/announcements.service";
import { toastError, toastSuccess, toastWarning } from "@/services/feedback/toast.service";

const announcementSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  body: z.string().trim().min(10, "Body must be at least 10 characters"),
  audience: z.enum(["ALL", "VOLUNTEERS", "LGU", "BARANGAY"]),
});

export type AnnouncementFormErrors = Partial<Record<keyof AnnouncementDraftInput, string>>;

export function useLguAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      setError(null);
      seedAnnouncementsIfEmpty();
      setItems(listAnnouncements());
    } catch (e: any) {
      setError(e?.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const audiences: { value: AnnouncementAudience; label: string }[] = useMemo(
    () => [
      { value: "LGU", label: "LGU Staff" },
      { value: "ALL", label: "All" },
      { value: "VOLUNTEERS", label: "Volunteers" },
      { value: "BARANGAY", label: "Barangay" },
    ],
    []
  );

  const validate = useCallback((input: AnnouncementDraftInput) => {
    const parsed = announcementSchema.safeParse(input);
    if (parsed.success) return { ok: true as const, value: parsed.data, errors: {} as AnnouncementFormErrors };

    const errors: AnnouncementFormErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof AnnouncementDraftInput;
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false as const, value: input, errors };
  }, []);

  const create = useCallback((input: AnnouncementDraftInput) => {
    const v = validate(input);
    if (!v.ok) {
      toastWarning("Please fix the form errors before saving.");
      return v;
    }
    try {
      setError(null);
      createAnnouncement(v.value);
      refresh();
      toastSuccess("Announcement saved.");
      return { ok: true as const, errors: {} as AnnouncementFormErrors };
    } catch (e: any) {
      const message = e?.message || "Failed to create announcement";
      setError(message);
      toastError(message);
      return { ok: false as const, errors: {} as AnnouncementFormErrors };
    }
  }, [refresh, validate]);

  const update = useCallback((id: string, patch: AnnouncementDraftInput) => {
    const v = validate(patch);
    if (!v.ok) {
      toastWarning("Please fix the form errors before saving.");
      return v;
    }
    try {
      setError(null);
      updateAnnouncement(id, v.value);
      refresh();
      toastSuccess("Announcement updated.");
      return { ok: true as const, errors: {} as AnnouncementFormErrors };
    } catch (e: any) {
      const message = e?.message || "Failed to update announcement";
      setError(message);
      toastError(message);
      return { ok: false as const, errors: {} as AnnouncementFormErrors };
    }
  }, [refresh, validate]);

  const publish = useCallback(async (id: string) => {
    try {
      setError(null);
      setBusyId(id);
      publishAnnouncement(id);
      refresh();
      toastSuccess("Announcement published.");
    } catch (e: any) {
      const message = e?.message || "Failed to publish";
      setError(message);
      toastError(message);
    } finally {
      setBusyId(null);
    }
  }, [refresh]);

  const unpublish = useCallback(async (id: string) => {
    try {
      setError(null);
      setBusyId(id);
      unpublishAnnouncement(id);
      refresh();
      toastSuccess("Announcement unpublished.");
    } catch (e: any) {
      const message = e?.message || "Failed to unpublish";
      setError(message);
      toastError(message);
    } finally {
      setBusyId(null);
    }
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    try {
      setError(null);
      setBusyId(id);
      deleteAnnouncement(id);
      refresh();
      toastSuccess("Announcement deleted.");
    } catch (e: any) {
      const message = e?.message || "Failed to delete";
      setError(message);
      toastError(message);
    } finally {
      setBusyId(null);
    }
  }, [refresh]);

  return {
    loading,
    announcements: items,
    error,
    busyId,
    refresh,
    audiences,
    create,
    update,
    publish,
    unpublish,
    remove,
    validate,
  };
}
