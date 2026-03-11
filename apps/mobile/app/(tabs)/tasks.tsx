import React from "react";
import { useAuth } from "../../features/auth/AuthProvider";
import { TasksScreen } from "../../features/dispatch/screens/TasksScreen";
import { MyRequestsHistoryScreen } from "../../features/requests/screens/MyRequestsHistoryScreen";

export default function TasksRoute() {
  const { user } = useAuth();
  const normalizedRole = String(user?.role ?? "").trim().toUpperCase();

  if (normalizedRole === "COMMUNITY") {
    return <MyRequestsHistoryScreen />;
  }

  return <TasksScreen />;
}
