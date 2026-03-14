import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import type { Announcement, AnnouncementAudience, AnnouncementDraftInput } from "../models/announcements.types";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  publishAnnouncement,
  unpublishAnnouncement,
  updateAnnouncement,
} from "../services/announcements.service";
import { toastError, toastSuccess, toastWarning } from "@/services/feedback/toast.service";

const announcementSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  body: z.string().trim().min(10, "Body must be at least 10 characters"),
  audience: z.enum(["ALL", "VOLUNTEER", "LGU", "PUBLIC"]),
});

export type AnnouncementFormErrors = Partial<Record<keyof AnnouncementDraftInput, string>>;

function resolveErrorMessage(error: unknown, fallback: string) {
  const typed = error as { response?: { data?: { message?: string } }; message?: string };
  return typed?.response?.data?.message || typed?.message || fallback;
}

export function useLguAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const { items: nextItems } = await listAnnouncements({
        page: 1,
        limit: 100,
      });
      setItems(nextItems);
    } catch (error) {
      setError(resolveErrorMessage(error, "Failed to load announcements"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const audiences: { value: AnnouncementAudience; label: string }[] = useMemo(
    () => [
      { value: "LGU", label: "LGU Staff" },
      { value: "ALL", label: "All" },
      { value: "VOLUNTEER", label: "Volunteers" },
      { value: "PUBLIC", label: "Public" },
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

  const create = useCallback(async (input: AnnouncementDraftInput) => {
    const v = validate(input);
    if (!v.ok) {
      toastWarning("Please fix the form errors before saving.");
      return v;
    }
    try {
      setError(null);
      await createAnnouncement(v.value);
      await refresh();
      toastSuccess("Announcement saved.");
      return { ok: true as const, errors: {} as AnnouncementFormErrors };
    } catch (error) {
      const message = resolveErrorMessage(error, "Failed to create announcement");
      setError(message);
      toastError(message);
      return { ok: false as const, errors: {} as AnnouncementFormErrors };
    }
  }, [refresh, validate]);

  const update = useCallback(async (id: string, patch: AnnouncementDraftInput) => {
    const v = validate(patch);
    if (!v.ok) {
      toastWarning("Please fix the form errors before saving.");
      return v;
    }
    try {
      setError(null);
      await updateAnnouncement(id, v.value);
      await refresh();
      toastSuccess("Announcement updated.");
      return { ok: true as const, errors: {} as AnnouncementFormErrors };
    } catch (error) {
      const message = resolveErrorMessage(error, "Failed to update announcement");
      setError(message);
      toastError(message);
      return { ok: false as const, errors: {} as AnnouncementFormErrors };
    }
  }, [refresh, validate]);

  const publish = useCallback(async (id: string) => {
    try {
      setError(null);
      setBusyId(id);
      await publishAnnouncement(id);
      await refresh();
      toastSuccess("Announcement published.");
    } catch (error) {
      const message = resolveErrorMessage(error, "Failed to publish");
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
      await unpublishAnnouncement(id);
      await refresh();
      toastSuccess("Announcement unpublished.");
    } catch (error) {
      const message = resolveErrorMessage(error, "Failed to unpublish");
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
      await deleteAnnouncement(id);
      await refresh();
      toastSuccess("Announcement deleted.");
    } catch (error) {
      const message = resolveErrorMessage(error, "Failed to delete");
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
