import { useCallback, useEffect, useMemo, useState } from "react";
import { useLguSession } from "@/features/auth/hooks/useLguSession";
import { toastError, toastSuccess } from "@/services/feedback/toast.service";
import type { AdminUserItem } from "../models/adminUsers.types";
import {
  createAdminUser,
  listAdminUsers,
  reactivateAdminUser,
  suspendAdminUser,
} from "../services/adminUsers.service";

export type AdminUsersTab = "LGU" | "CDRRMO" | "VOLUNTEER" | "COMMUNITY";

const tabRoleMap: Record<AdminUsersTab, "LGU" | "ADMIN" | "VOLUNTEER" | "COMMUNITY"> = {
  LGU: "LGU",
  CDRRMO: "ADMIN",
  VOLUNTEER: "VOLUNTEER",
  COMMUNITY: "COMMUNITY",
};

export function useAdminUsers() {
  const { user } = useLguSession();
  const isSuper = user?.role === "ADMIN" && user?.adminTier === "SUPER";

  const [tab, setTab] = useState<AdminUsersTab>("LGU");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [items, setItems] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const role = tabRoleMap[tab];
      const result = await listAdminUsers({
        q: query.trim() || undefined,
        role,
        adminTier: tab === "CDRRMO" ? "CDRRMO" : undefined,
        page,
        limit,
      });

      setItems(result.items);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [limit, page, query, tab]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createLguAccount = useCallback(
    async (input: {
      username: string;
      password: string;
      firstName: string;
      lastName: string;
      lguPosition?: string;
      barangay: string;
      email?: string;
    }) => {
      if (!isSuper) return;
      setBusyId("create_lgu");
      try {
        await createAdminUser({
          username: input.username,
          password: input.password,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          role: "LGU",
          barangay: input.barangay,
          lguName: input.barangay,
          lguPosition: input.lguPosition,
        });
        toastSuccess("LGU account created.");
        await refresh();
      } catch (err: any) {
        toastError(err?.response?.data?.message ?? err?.message ?? "Failed to create LGU account");
        throw err;
      } finally {
        setBusyId(null);
      }
    },
    [isSuper, refresh]
  );

  const createCdrrmoAdmin = useCallback(
    async (input: {
      username: string;
      password: string;
      firstName: string;
      lastName: string;
      email: string;
    }) => {
      if (!isSuper) return;
      setBusyId("create_cdrrmo");
      try {
        await createAdminUser({
          username: input.username,
          password: input.password,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          role: "ADMIN",
        });
        toastSuccess("CDRRMO admin account created.");
        await refresh();
      } catch (err: any) {
        toastError(err?.response?.data?.message ?? err?.message ?? "Failed to create CDRRMO account");
        throw err;
      } finally {
        setBusyId(null);
      }
    },
    [isSuper, refresh]
  );

  const toggleActivation = useCallback(async (item: AdminUserItem) => {
    setBusyId(item.id);
    try {
      if (item.isActive) {
        await suspendAdminUser(item.id);
        toastSuccess("User suspended.");
      } else {
        await reactivateAdminUser(item.id);
        toastSuccess("User reactivated.");
      }
      await refresh();
    } catch (err: any) {
      toastError(err?.response?.data?.message ?? err?.message ?? "Failed to update account status");
    } finally {
      setBusyId(null);
    }
  }, [refresh]);

  const visibleTabs = useMemo(() => {
    if (isSuper) return ["LGU", "CDRRMO", "VOLUNTEER", "COMMUNITY"] as AdminUsersTab[];
    return ["LGU", "VOLUNTEER", "COMMUNITY"] as AdminUsersTab[];
  }, [isSuper]);

  return {
    isSuper,
    tab,
    setTab,
    visibleTabs,
    query,
    setQuery,
    page,
    setPage,
    limit,
    setLimit,
    items,
    loading,
    error,
    busyId,
    pagination,
    refresh,
    createLguAccount,
    createCdrrmoAdmin,
    toggleActivation,
  };
}
