import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as Network from "expo-network";
import type { ConnectivityState } from "./models/connectivity.types";

export const ConnectivityContext = createContext<ConnectivityState | null>(null);

function deriveConnectivity(state: Network.NetworkState | null): Omit<ConnectivityState, "checkConnectivity"> {
  if (!state) {
    return {
      status: "unknown",
      isOnline: false,
      isOffline: false,
      isInternetReachable: null,
      networkType: null,
    };
  }

  const { isConnected, isInternetReachable, type } = state;
  const connected = isConnected === true;
  const reachable = typeof isInternetReachable === "boolean" ? isInternetReachable : null;

  // Definitely disconnected or explicitly unreachable
  if (isConnected === false || reachable === false) {
    return {
      status: "offline",
      isOnline: false,
      isOffline: true,
      isInternetReachable: reachable ?? false,
      networkType: type ?? null,
    };
  }

  // Definitely connected
  if (connected) {
    return {
      status: "online",
      isOnline: true,
      isOffline: false,
      isInternetReachable: reachable ?? true,
      networkType: type ?? null,
    };
  }

  return {
    status: "unknown",
    isOnline: false,
    isOffline: false,
    isInternetReachable: null,
    networkType: type ?? null,
  };
}

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<Omit<ConnectivityState, "checkConnectivity">>({
    status: "unknown",
    isOnline: false,
    isOffline: false,
    isInternetReachable: null,
    networkType: null,
  });

  const checkConnectivity = useCallback(async (): Promise<ConnectivityState> => {
    try {
      const state = await Network.getNetworkStateAsync();
      const derived = deriveConnectivity(state);
      setSnapshot(derived);
      return {
        ...derived,
        checkConnectivity,
      };
    } catch {
      const fallback: ConnectivityState = {
        status: "unknown",
        isOnline: false,
        isOffline: false,
        isInternetReachable: null,
        networkType: null,
        checkConnectivity,
      };
      setSnapshot(fallback);
      return fallback;
    }
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (!active) return;
        setSnapshot(deriveConnectivity(state));
      } catch {
        if (!active) return;
        setSnapshot(deriveConnectivity(null));
      }
    })();

    let subscription: ReturnType<typeof Network.addNetworkStateListener> | null = null;
    try {
      subscription = Network.addNetworkStateListener((event) => {
        if (!active) return;
        setSnapshot(deriveConnectivity(event));
      });
    } catch {
      // In environments where listeners are unsupported, initial check is used.
    }

    return () => {
      active = false;
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, []);

  const value = useMemo<ConnectivityState>(
    () => ({
      ...snapshot,
      checkConnectivity,
    }),
    [snapshot, checkConnectivity]
  );

  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}
