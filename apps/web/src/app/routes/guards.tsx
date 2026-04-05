import { Navigate, Outlet } from "react-router-dom";
import { getLguUser } from "@/features/auth/services/authStorage";

export function RequireLguAuth() {
  const user = getLguUser();

  if (!user?.id) {
    return <Navigate to="/lgu/login" replace />;
  }

  return <Outlet />;
}

export function RequireAdminAuth() {
  const user = getLguUser();

  if (!user?.id || user?.role !== "ADMIN") {
    return <Navigate to="/lgu/login" replace />;
  }

  return <Outlet />;
}
