import { useContext } from "react";
import { ConnectivityContext } from "../ConnectivityProvider";
import type { ConnectivityState } from "../models/connectivity.types";

export function useConnectivity(): ConnectivityState {
  const context = useContext(ConnectivityContext);
  if (!context) {
    throw new Error("useConnectivity must be used within a ConnectivityProvider");
  }
  return context;
}
