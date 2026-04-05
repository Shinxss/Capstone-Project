import { Navigate, Route, Routes } from "react-router-dom";
import LguLogin from "./pages/Login";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmDialogProvider } from "@/features/feedback/context/confirm.context";
import { renderLguRoutes } from "@/app/routes/lgu.routes";
import { renderAdminRoutes } from "@/app/routes/admin.routes";

export default function App() {
  return (
    <ConfirmDialogProvider>
      <Toaster />
      <Routes>
        <Route path="/lgu/login" element={<LguLogin />} />
        {renderLguRoutes()}
        {renderAdminRoutes()}

        <Route path="*" element={<Navigate to="/lgu/login" replace />} />
      </Routes>
    </ConfirmDialogProvider>
  );
}
