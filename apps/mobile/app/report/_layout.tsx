import React, { useEffect } from "react";
import { router } from "expo-router";
import AuthRequiredModal from "../../components/AuthRequiredModal";
import { useAuthRequiredPrompt } from "../../features/auth/hooks/useAuthRequiredPrompt";
import { useSession } from "../../features/auth/hooks/useSession";
import { ReportNavigator } from "../../features/report/navigation/report.navigator";

export default function ReportLayout() {
  const { isUser } = useSession();
  const { openAuthRequired, closeAuthRequired, modalProps } = useAuthRequiredPrompt();

  useEffect(() => {
    if (isUser) return;
    openAuthRequired({ blockedAction: "report_emergency" });
  }, [isUser, openAuthRequired]);

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
