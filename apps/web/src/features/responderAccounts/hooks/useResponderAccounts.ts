import { useCallback, useEffect, useMemo, useState } from "react";
import { useConfirm } from "@/features/feedback/hooks/useConfirm";
import { getLguUser } from "@/features/auth/services/authStorage";
import { toastError, toastSuccess } from "@/services/feedback/toast.service";
import type {
  CreateResponderAccountPayload,
  ResponderAccountDetails,
  ResponderAccountListItem,
  ResponderAccountsListQuery,
  UpdateResponderAccountPayload,
} from "../models/responderAccount.types";
import {
  createResponderAccount,
  getResponderAccount,
  listResponderAccounts,
  reactivateResponderAccount,
  suspendResponderAccount,
  updateResponderAccount,
} from "../services/responderAccounts.service";

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

export function useResponderAccounts() {
  const confirm = useConfirm();
  const currentUser = getLguUser();

  const [items, setItems] = useState<ResponderAccountListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<ResponderAccountsListQuery["isActive"]>("all");
  const [onDutyFilter, setOnDutyFilter] = useState<ResponderAccountsListQuery["onDuty"]>("all");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [formLoading, setFormLoading] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ResponderAccountDetails | null>(null);

  const [busyAccountId, setBusyAccountId] = useState<string | null>(null);

  const role = String(currentUser?.role ?? "").trim().toUpperCase();
  const isLgu = role === "LGU";

  const listQuery = useMemo<ResponderAccountsListQuery>(
    () => ({
      q: query,
      isActive: isActiveFilter,
      onDuty: onDutyFilter,
      page,
      limit,
    }),
    [query, isActiveFilter, onDutyFilter, page]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await listResponderAccounts(listQuery);
      setItems(response.items);
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
      setPage(response.pagination.page);
    } catch (err) {
      setError(resolveErrorMessage(err, "Failed to load responder accounts"));
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
  }, [query, isActiveFilter, onDutyFilter]);

  const openCreate = useCallback(() => {
    setSelectedAccount(null);
    setFormMode("create");
    setFormOpen(true);
  }, []);

  const openEdit = useCallback(async (accountId: string) => {
    setFormMode("edit");
    setFormLoading(true);
    setFormOpen(true);

    try {
      const account = await getResponderAccount(accountId);
      setSelectedAccount(account);
    } catch (err) {
      setError(resolveErrorMessage(err, "Failed to load responder account details"));
      toastError(resolveErrorMessage(err, "Failed to load responder account details"));
      setFormOpen(false);
    } finally {
      setFormLoading(false);
    }
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setSelectedAccount(null);
    setFormLoading(false);
    setFormSaving(false);
  }, []);

  const saveCreate = useCallback(
    async (payload: CreateResponderAccountPayload) => {
      setFormSaving(true);
      try {
        await createResponderAccount(payload);
        toastSuccess("Responder account created.");
        closeForm();
        await refresh();
      } catch (err) {
        const message = resolveErrorMessage(err, "Failed to create responder account");
        toastError(message);
        throw new Error(message);
      } finally {
        setFormSaving(false);
      }
    },
    [closeForm, refresh]
  );

  const saveUpdate = useCallback(
    async (payload: UpdateResponderAccountPayload) => {
      if (!selectedAccount?.id) return;

      setFormSaving(true);
      try {
        await updateResponderAccount(selectedAccount.id, payload);
        toastSuccess("Responder account updated.");
        closeForm();
        await refresh();
      } catch (err) {
        const message = resolveErrorMessage(err, "Failed to update responder account");
        toastError(message);
        throw new Error(message);
      } finally {
        setFormSaving(false);
      }
    },
    [closeForm, refresh, selectedAccount?.id]
  );

  const toggleActivation = useCallback(
    async (account: ResponderAccountListItem) => {
      const willSuspend = account.isActive;
      const ok = await confirm({
        title: willSuspend ? "Suspend responder account?" : "Reactivate responder account?",
        description: willSuspend
          ? `This will prevent ${account.fullName} from receiving dispatch tasks until reactivated.`
          : `${account.fullName} will be allowed to receive dispatch tasks again.`,
        confirmText: willSuspend ? "Suspend" : "Reactivate",
        cancelText: "Cancel",
        variant: willSuspend ? "destructive" : "default",
      });

      if (!ok) return;

      setBusyAccountId(account.id);
      try {
        if (willSuspend) {
          await suspendResponderAccount(account.id);
          toastSuccess("Responder account suspended.");
        } else {
          await reactivateResponderAccount(account.id);
          toastSuccess("Responder account reactivated.");
        }

        await refresh();
      } catch (err) {
        toastError(resolveErrorMessage(err, "Failed to update responder account status"));
      } finally {
        setBusyAccountId(null);
      }
    },
    [confirm, refresh]
  );

  return {
    loading,
    error,
    accounts: items,
    total,
    totalPages,
    page,
    setPage,
    query,
    setQuery,
    isActiveFilter,
    setIsActiveFilter,
    onDutyFilter,
    setOnDutyFilter,
    refresh,

    formOpen,
    formMode,
    formLoading,
    formSaving,
    selectedAccount,
    openCreate,
    openEdit,
    closeForm,
    saveCreate,
    saveUpdate,

    busyAccountId,
    toggleActivation,

    isLgu,
    defaultBarangay: isLgu ? String(currentUser?.barangay ?? "").trim() : "",
  };
}
