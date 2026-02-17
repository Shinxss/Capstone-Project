import { useMemo } from "react";
import { useAuth } from "../AuthProvider";
import { isTasksRoleAllowed } from "../constants/accessControl";

type BlockReason = "guest" | "role";

export function useTasksAccess() {
  const { hydrated, user, mode } = useAuth();

  return useMemo(() => {
    const isAuthed = mode === "authed" && Boolean(user);
    const role = typeof user?.role === "string" ? user.role : undefined;
    const roleAllowed = isTasksRoleAllowed(role);
    const canAccessTasks = isAuthed && roleAllowed;
    const blockReason: BlockReason | null = canAccessTasks ? null : isAuthed ? "role" : "guest";

    return {
      hydrated,
      isAuthed,
      role,
      canAccessTasks,
      blockReason,
    };
  }, [hydrated, mode, user]);
}
