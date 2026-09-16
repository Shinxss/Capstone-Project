import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "../../auth/AuthProvider";
import { connectRealtime, sendVolunteerHeartbeat } from "../../realtime/socketClient";

export function useResponderDutyStatus() {
  const { mode, token, user, updateUser } = useAuth();
  const [updatingDuty, setUpdatingDuty] = useState(false);
  const updatingRef = useRef(false);

  const isResponder = mode === "authed" && String(user?.role ?? "").trim().toUpperCase() === "RESPONDER";
  const onDuty = isResponder && Boolean(user?.onDuty);

  const setOnDuty = useCallback(
    async (nextValue: boolean) => {
      if (!isResponder || !token || updatingRef.current) return;

      const socket = connectRealtime(token);
      if (!socket?.connected) {
        Alert.alert("Unable to update availability", "Check your connection and try again.");
        return;
      }

      updatingRef.current = true;
      setUpdatingDuty(true);

      try {
        const result = await sendVolunteerHeartbeat(socket, nextValue);
        if (!result.ok) {
          if (typeof result.onDuty === "boolean") {
            await updateUser({ onDuty: result.onDuty });
          }
          Alert.alert(
            "Unable to update availability",
            String(result.message ?? "Please try again.")
          );
          return;
        }

        await updateUser({ onDuty: Boolean(result.onDuty ?? nextValue) });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Please try again.";
        Alert.alert("Unable to update availability", message);
      } finally {
        updatingRef.current = false;
        setUpdatingDuty(false);
      }
    },
    [isResponder, token, updateUser]
  );

  return {
    isResponder,
    onDuty,
    updatingDuty,
    setOnDuty,
  };
}
