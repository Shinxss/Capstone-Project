import React, { useEffect } from "react";
import { router } from "expo-router";
import AuthRequiredModal from "../../components/AuthRequiredModal";
import { useAuth } from "../../features/auth/AuthProvider";
import { useAuthRequiredPrompt } from "../../features/auth/hooks/useAuthRequiredPrompt";
import { ReportNavigator } from "../../features/report/navigation/report.navigator";

export default function ReportLayout() {
  const { hydrated, mode } = useAuth();
  const isUser = hydrated && mode === "authed";
  const { openAuthRequired, closeAuthRequired, modalProps } = useAuthRequiredPrompt();

  useEffect(() => {
    if (!hydrated) return;
    if (isUser) return;
    openAuthRequired({ blockedAction: "report_emergency" });
  }, [hydrated, isUser, openAuthRequired]);

  if (!hydrated) return null;

  if (!isUser) {
    return (
      <AuthRequiredModal
        {...modalProps}
        onClose={() => {
          closeAuthRequired();
          router.replace("/(tabs)");
        }}
      />
    );
  }

  return <ReportNavigator />;
}
