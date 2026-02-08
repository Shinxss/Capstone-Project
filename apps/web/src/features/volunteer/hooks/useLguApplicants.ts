import { useCallback, useEffect, useMemo, useState } from "react";
import type { VolunteerApplication, VolunteerApplicationStatus } from "../models/volunteerApplication.types";
import {
  getVolunteerApplicationById,
  listVolunteerApplications,
  reviewVolunteerApplication,
} from "../services/lguVolunteerApplications.service";

type Filter = "all" | "pending_verification" | "needs_info";

export function useLguApplicants() {
  // list state
  const [items, setItems] = useState<VolunteerApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const statusParam = useMemo<VolunteerApplicationStatus[] | undefined>(() => {
    if (filter === "all") return ["pending_verification", "needs_info"];
    return [filter];
  }, [filter]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setListError(null);

    try {
      const res = await listVolunteerApplications({
        q: query.trim() || undefined,
        status: statusParam,
        page,
        limit,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e: any) {
      setListError(e?.response?.data?.message || e?.message || "Failed to load applicants");
    } finally {
      setLoading(false);
    }
  }, [query, statusParam, page]);

  useEffect(() => {
    const t = setTimeout(() => void fetchList(), 250);
    return () => clearTimeout(t);
  }, [fetchList]);

  // modal/details state
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<VolunteerApplication | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // review state
  const [notes, setNotes] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const openDetails = useCallback(async (id: string) => {
    setOpen(true);
    setSelectedId(id);
    setSelected(null);
    setNotes("");
    setDetailsError(null);
    setReviewError(null);
    setDetailsLoading(true);

    try {
      const doc = await getVolunteerApplicationById(id);
      setSelected(doc);
    } catch (e: any) {
      setDetailsError(e?.response?.data?.message || e?.message || "Failed to load application");
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const closeDetails = useCallback(() => {
    setOpen(false);
    setSelectedId(null);
    setSelected(null);
    setNotes("");
    setDetailsError(null);
    setReviewError(null);
  }, []);

  const review = useCallback(
    async (action: "verified" | "needs_info" | "rejected") => {
      if (!selectedId) return;

      setReviewLoading(true);
      setReviewError(null);

      try {
        const updated = await reviewVolunteerApplication(selectedId, {
          action,
          notes: notes.trim() || undefined,
        });

        // quick UI sync
        setSelected(updated);

        // if verified/rejected, remove from Applicants list
        if (action === "verified" || action === "rejected") {
          setItems((prev) => prev.filter((x) => x._id !== selectedId));
          closeDetails();
        } else {
          // needs_info stays listed
          setItems((prev) =>
            prev.map((x) => (x._id === selectedId ? { ...x, status: updated.status } : x))
          );
        }

        // refresh to sync counts
        void fetchList();
      } catch (e: any) {
        setReviewError(e?.response?.data?.message || e?.message || "Review failed");
      } finally {
        setReviewLoading(false);
      }
    },
    [selectedId, notes, closeDetails, fetchList]
  );

  const counts = useMemo(() => {
    const pending = items.filter((x) => x.status === "pending_verification").length;
    const needsInfo = items.filter((x) => x.status === "needs_info").length;
    return { pending, needsInfo };
  }, [items]);

  return {
    // list
    items,
    total,
    loading,
    listError,
    query,
    setQuery,
    filter,
    setFilter,
    page,
    setPage,
    limit,
    refresh: fetchList,
    counts,

    // modal/details
    open,
    selected,
    detailsLoading,
    detailsError,
    openDetails,
    closeDetails,

    // review
    notes,
    setNotes,
    reviewLoading,
    reviewError,
    review,
  };
}
