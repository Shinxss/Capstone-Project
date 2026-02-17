import React, { useCallback, useState } from "react";
import { Tabs, useRouter } from "expo-router";
import BottomNav from "../../components/BottomNav";
import AuthRequiredModal from "../../components/AuthRequiredModal";
import { TASKS_GUARD_MODE } from "../../features/auth/constants/accessControl";
import { useTasksAccess } from "../../features/auth/hooks/useTasksAccess";
import { useAuth } from "../../features/auth/AuthProvider";

export default function TabLayout() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { canAccessTasks, blockReason } = useTasksAccess();
  const [showAuthRequired, setShowAuthRequired] = useState(false);

  const goLogin = useCallback(async () => {
    setShowAuthRequired(false);
    await signOut();
    router.replace("/(auth)/login");
  }, [router, signOut]);

  const onProtectedTabPress = useCallback(
    (e: { preventDefault: () => void }) => {
      if (canAccessTasks) return;

      e.preventDefault();
      if (TASKS_GUARD_MODE === "redirect") {
        void goLogin();
        return;
      }

      setShowAuthRequired(true);
    },
    [canAccessTasks, goLogin]
  );

  const modalTitle = blockReason === "role" ? "Access Restricted" : "Login Required";
  const modalMessage =
    blockReason === "role"
      ? "Your account role does not have permission to access Tasks."
      : "You need to log in to access Tasks.";

  return (
    <>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <BottomNav {...props} />}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="map" />
        <Tabs.Screen
          name="alert"
          listeners={{
            tabPress: onProtectedTabPress,
          }}
        />
        <Tabs.Screen name="more" />
      </Tabs>

      <AuthRequiredModal
        visible={showAuthRequired}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setShowAuthRequired(false)}
        onLogin={goLogin}
      />
    </>
  );
}
