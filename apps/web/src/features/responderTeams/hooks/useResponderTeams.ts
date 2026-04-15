import { useCallback, useEffect, useMemo, useState } from "react";
import { useConfirm } from "@/features/feedback/hooks/useConfirm";
import { getLguUser } from "@/features/auth/services/authStorage";
import { toastError, toastSuccess } from "@/services/feedback/toast.service";
import type {
  CreateResponderTeamPayload,
  ResponderMemberOption,
  ResponderTeamDetails,
  ResponderTeamListItem,
  ResponderTeamsListQuery,
  UpdateResponderTeamPayload,
} from "../models/responderTeam.types";
import {
  archiveResponderTeam,
  createResponderTeam,
  getResponderTeam,
  listResponderMemberOptions,
  listResponderTeams,
  restoreResponderTeam,
  updateResponderTeam,
} from "../services/responderTeams.service";

type FormMode = "create" | "edit";

function resolveErrorMessage(error: unknown, fallback: string) {
  const typed = error as {
    response?: {
      data?: {
        message?: string;
        errors?: {
          formErrors?: string[];
          fieldErrors?: Record<string, string[] | undefined>;
        };
      };
    };
    message?: string;
  };

  const apiMessage = String(typed?.response?.data?.message ?? "").trim();
  const validation = typed?.response?.data?.errors;
  if (apiMessage.toLowerCase() === "validation error" && validation) {
    const formError = validation.formErrors?.find(Boolean);
    if (formError) return formError;

    const firstField = Object.values(validation.fieldErrors ?? {}).find(
      (messages) => Array.isArray(messages) && messages.length > 0 && Boolean(messages[0])
    );
    if (Array.isArray(firstField) && firstField[0]) {
      return firstField[0];
    }
  }

  return apiMessage || typed?.message || fallback;
}

export function useResponderTeams() {
  const confirm = useConfirm();
  const currentUser = getLguUser();

  const [teams, setTeams] = useState<ResponderTeamListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<ResponderTeamsListQuery["isActive"]>("active");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [formLoading, setFormLoading] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<ResponderTeamDetails | null>(null);

  const [memberOptions, setMemberOptions] = useState<ResponderMemberOption[]>([]);
  const [memberOptionsLoading, setMemberOptionsLoading] = useState(false);

  const [busyTeamId, setBusyTeamId] = useState<string | null>(null);

  const role = String(currentUser?.role ?? "").trim().toUpperCase();
  const isLgu = role === "LGU";

  const listQuery = useMemo<ResponderTeamsListQuery>(
    () => ({
      q: query,
      isActive: isActiveFilter,
      page,
      limit,
    }),
    [query, isActiveFilter, page]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listResponderTeams(listQuery);
      setTeams(result.items);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
      setPage(result.pagination.page);
    } catch (err) {
      setError(resolveErrorMessage(err, "Failed to load responder teams"));
    } finally {
      setLoading(false);
    }
  }, [listQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [query, isActiveFilter]);

  const loadMemberOptions = useCallback(async () => {
    setMemberOptionsLoading(true);

    try {
      const next = await listResponderMemberOptions({
        barangay: isLgu ? String(currentUser?.barangay ?? "").trim() || undefined : undefined,
        limit: 100,
      });
      setMemberOptions(next);
    } catch (err) {
      const message = resolveErrorMessage(err, "Failed to load responder options");
      toastError(message);
      setMemberOptions([]);
    } finally {
      setMemberOptionsLoading(false);
    }
  }, [currentUser?.barangay, isLgu]);

  const openCreate = useCallback(async () => {
    setSelectedTeam(null);
    setFormMode("create");
    setFormOpen(true);
    await loadMemberOptions();
  }, [loadMemberOptions]);

  const openEdit = useCallback(
    async (teamId: string) => {
      setFormMode("edit");
      setFormOpen(true);
      setFormLoading(true);

      try {
        const [team] = await Promise.all([getResponderTeam(teamId), loadMemberOptions()]);
        setSelectedTeam(team);
      } catch (err) {
        const message = resolveErrorMessage(err, "Failed to load responder team details");
        setError(message);
        toastError(message);
        setFormOpen(false);
      } finally {
        setFormLoading(false);
      }
    },
    [loadMemberOptions]
  );

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setSelectedTeam(null);
    setFormLoading(false);
    setFormSaving(false);
  }, []);

  const saveCreate = useCallback(
    async (payload: CreateResponderTeamPayload) => {
      setFormSaving(true);
      try {
        await createResponderTeam(payload);
        toastSuccess("Responder team created.");
        closeForm();
        await refresh();
      } catch (err) {
        const message = resolveErrorMessage(err, "Failed to create responder team");
        toastError(message);
        throw new Error(message);
      } finally {
        setFormSaving(false);
      }
    },
    [closeForm, refresh]
  );

  const saveUpdate = useCallback(
    async (payload: UpdateResponderTeamPayload) => {
      if (!selectedTeam?.id) return;

      setFormSaving(true);
      try {
        await updateResponderTeam(selectedTeam.id, payload);
        toastSuccess("Responder team updated.");
        closeForm();
        await refresh();
      } catch (err) {
        const message = resolveErrorMessage(err, "Failed to update responder team");
        toastError(message);
        throw new Error(message);
      } finally {
        setFormSaving(false);
      }
    },
    [closeForm, refresh, selectedTeam?.id]
  );

  const toggleArchive = useCallback(
    async (team: ResponderTeamListItem) => {
      const willArchive = team.isActive;
      const ok = await confirm({
        title: willArchive ? "Archive responder team?" : "Restore responder team?",
        description: willArchive
          ? `${team.name} will be hidden from active dispatch grouping until restored.`
          : `${team.name} will be restored and available for dispatch grouping again.`,
        confirmText: willArchive ? "Archive" : "Restore",
        cancelText: "Cancel",
        variant: willArchive ? "destructive" : "default",
      });

      if (!ok) return;

      setBusyTeamId(team.id);
      try {
        if (willArchive) {
          await archiveResponderTeam(team.id);
          toastSuccess("Responder team archived.");
        } else {
          await restoreResponderTeam(team.id);
          toastSuccess("Responder team restored.");
        }
        await refresh();
      } catch (err) {
        toastError(resolveErrorMessage(err, "Failed to update responder team status"));
      } finally {
        setBusyTeamId(null);
      }
    },
    [confirm, refresh]
  );

  return {
    loading,
    error,
    teams,
    total,
    totalPages,
    page,
    setPage,
    query,
    setQuery,
    isActiveFilter,
    setIsActiveFilter,
    refresh,

    formOpen,
    formMode,
    formLoading,
    formSaving,
    selectedTeam,
    openCreate,
    openEdit,
    closeForm,
    saveCreate,
    saveUpdate,

    memberOptions,
    memberOptionsLoading,

    busyTeamId,
    toggleArchive,

    isLgu,
    defaultBarangay: isLgu ? String(currentUser?.barangay ?? "").trim() : "",
  };
}

