import { useCallback, useEffect, useState } from "react";
import { toastError, toastSuccess } from "@/services/feedback/toast.service";
import type { AdminAnnouncementDraftInput, AdminAnnouncementStatus } from "../models/adminAnnouncements.types";
import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  listAdminAnnouncements,
  publishAdminAnnouncement,
  unpublishAdminAnnouncement,
  updateAdminAnnouncement,
} from "../services/adminAnnouncements.service";

export function useAdminAnnouncements() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof listAdminAnnouncements>>["items"]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<AdminAnnouncementStatus | "">("");
  const [q, setQ] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listAdminAnnouncements({ status, q: q.trim() || undefined, page: 1, limit: 100 });
      setItems(result.items);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to load announcements";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async (input: AdminAnnouncementDraftInput) => {
    setBusyId("new");
    try {
      await createAdminAnnouncement(input);
      toastSuccess("Announcement created.");
      await refresh();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to create announcement";
      toastError(message);
      throw err;
    } finally {
      setBusyId(null);
    }
  }, [refresh]);

  const update = useCallback(async (id: string, patch: Partial<AdminAnnouncementDraftInput>) => {
    setBusyId(id);
    try {
      await updateAdminAnnouncement(id, patch);
      toastSuccess("Announcement updated.");
      await refresh();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to update announcement";
      toastError(message);
      throw err;
    } finally {
      setBusyId(null);
    }
  }, [refresh]);

  const publish = useCallback(async (id: string) => {
    setBusyId(id);
    try {
      await publishAdminAnnouncement(id);
      toastSuccess("Announcement published.");
      await refresh();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to publish announcement";
      toastError(message);
      throw err;
    } finally {
      setBusyId(null);
    }
  }, [refresh]);

  const unpublish = useCallback(async (id: string) => {
    setBusyId(id);
    try {
      await unpublishAdminAnnouncement(id);
      toastSuccess("Announcement moved to draft.");
      await refresh();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to unpublish announcement";
      toastError(message);
      throw err;
    } finally {
      setBusyId(null);
    }
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    setBusyId(id);
    try {
      await deleteAdminAnnouncement(id);
      toastSuccess("Announcement deleted.");
      await refresh();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to delete announcement";
      toastError(message);
      throw err;
    } finally {
      setBusyId(null);
    }
  }, [refresh]);

  return {
    items,
    loading,
    error,
    busyId,
    status,
    setStatus,
    q,
    setQ,
    refresh,
    create,
    update,
    publish,
    unpublish,
    remove,
  };
}
