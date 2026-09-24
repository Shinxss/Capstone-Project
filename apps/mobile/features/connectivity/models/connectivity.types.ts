import type { NetworkStateType } from "expo-network";

export type ConnectivityStatus = "unknown" | "online" | "offline";

export type ConnectivityState = {
  status: ConnectivityStatus;
  isOnline: boolean;
  isOffline: boolean;
  isInternetReachable: boolean | null;
  networkType: NetworkStateType | null;
  checkConnectivity: () => Promise<ConnectivityState>;
};
