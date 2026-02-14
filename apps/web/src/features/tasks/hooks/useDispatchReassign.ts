import { useCallback, useMemo, useState } from "react";
import { appendActivityLog } from "../../activityLog/services/activityLog.service";
import { createDispatchOffers, fetchDispatchVolunteers, type DispatchVolunteer } from "../services/dispatchAdminApi";

export function useDispatchReassign() {
  const [open, setOpen] = useState(false);
  const [emergencyId, setEmergencyId] = useState<string>("");
  const [label, setLabel] = useState<string>("");

  const [volunteers, setVolunteers] = useState<DispatchVolunteer[]>([]);
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dispatching, setDispatching] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const openReassign = useCallback(async (params: { emergencyId: string; label?: string }) => {
    setOpen(true);
    setEmergencyId(params.emergencyId);
    setLabel(params.label || "");
    setSelectedIds([]);
    setSuccess(null);
    setError(null);

    setLoadingVolunteers(true);
    try {
      const list = await fetchDispatchVolunteers();
      setVolunteers(list);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load volunteers");
      setVolunteers([]);
    } finally {
      setLoadingVolunteers(false);
    }
  }, []);

  const closeReassign = useCallback(() => {
    setOpen(false);
    setEmergencyId("");
    setLabel("");
    setSelectedIds([]);
    setError(null);
    setSuccess(null);
    setVolunteers([]);
  }, []);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const selectable = useMemo(() => {
    const set = new Set<string>();
    for (const v of volunteers) {
      if (v.status === "available") set.add(v.id);
    }
    return set;
  }, [volunteers]);

  const confirm = useCallback(async () => {
    if (!emergencyId) return;
    const ids = selectedIds.filter((id) => selectable.has(id));
    if (ids.length === 0) {
      setError("Select at least one available volunteer.");
      return;
    }

    setDispatching(true);
    setError(null);
    setSuccess(null);
    try {
      await createDispatchOffers({ emergencyId, volunteerIds: ids });
      setSuccess("Dispatch offers created.");
      appendActivityLog({
        action: "Reassigned dispatch (created new offers)",
        entityType: "dispatch",
        entityId: emergencyId,
        metadata: { volunteerIds: ids },
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to create dispatch offers");
    } finally {
      setDispatching(false);
    }
  }, [emergencyId, selectedIds, selectable]);

  return {
    open,
    emergencyId,
    label,
    volunteers,
    loadingVolunteers,
    selectedIds,
    dispatching,
    error,
    success,
    openReassign,
    closeReassign,
    toggle,
    confirm,
    selectable,
  };
}

