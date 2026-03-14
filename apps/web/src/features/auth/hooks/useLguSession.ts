import { useMemo, useSyncExternalStore } from "react";
import { getLguSessionSnapshot, type StoredPortalUser } from "../services/authStorage";

const SEP = "\u0000"; // very unlikely to appear in JSON

function subscribe(callback: () => void) {
  const onChange = () => callback();

  window.addEventListener("storage", onChange);
  window.addEventListener("lifeline-auth-changed", onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("lifeline-auth-changed", onChange);
  };
}

// ✅ IMPORTANT: return a STABLE primitive snapshot (string), not a new object
function getSnapshot() {
  const { token, userRaw } = getLguSessionSnapshot();
  return token + SEP + userRaw;
}

export function useLguSession() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // ✅ parse only when snap changes
  return useMemo(() => {
    const [token, userRaw = ""] = snap.split(SEP);

    let user: StoredPortalUser | null = null;
    if (userRaw) {
      try {
        user = JSON.parse(userRaw) as StoredPortalUser;
      } catch {
        user = null;
      }
    }

    return { token, user };
  }, [snap]);
}
