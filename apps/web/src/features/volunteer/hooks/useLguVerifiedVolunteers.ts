import { useCallback, useEffect, useMemo, useState } from "react";
import type { VolunteerApplication } from "../models/volunteerApplication.types";
import {
  getVolunteerApplicationById,
  listVolunteerApplications,
} from "../services/lguVolunteerApplications.service";

export function useLguVerifiedVolunteers() {
  // list state
  const [items, setItems] = useState<VolunteerApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchList = useCallback(async () => {
    setLoading(true);
    setListError(null);

    try {
      const res = await listVolunteerApplications({
        q: query.trim() || undefined,
        status: ["verified"],
        page,
        limit,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e: any) {
      setListError(e?.response?.data?.message || e?.message || "Failed to load verified volunteers");
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    const t = setTimeout(() => void fetchList(), 250);
    return () => clearTimeout(t);
  }, [fetchList]);

  // details modal state
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<VolunteerApplication | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const openDetails = useCallback(async (id: string) => {
    setOpen(true);
    setSelectedId(id);
    setSelected(null);
    setDetailsError(null);
    setDetailsLoading(true);

    try {
      const doc = await getVolunteerApplicationById(id);
      setSelected(doc);
    } catch (e: any) {
      setDetailsError(e?.response?.data?.message || e?.message || "Failed to load volunteer details");
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const closeDetails = useCallback(() => {
    setOpen(false);
    setSelectedId(null);
    setSelected(null);
    setDetailsError(null);
  }, []);

  const counts = useMemo(() => {
    // for now: just total verified
    return { verified: total };
  }, [total]);

  return {
    items,
    total,
    loading,
    listError,
    query,
    setQuery,
    page,
    setPage,
    limit,
    refresh: fetchList,
    counts,

    open,
    selected,
    detailsLoading,
    detailsError,
    openDetails,
    closeDetails,
  };
}
