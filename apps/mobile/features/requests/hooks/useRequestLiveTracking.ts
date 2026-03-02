import { useMyRequestTracking } from "./useMyRequestTracking";

export function useRequestLiveTracking(
  requestId: string | null | undefined,
  options?: { pollMs?: number; enabled?: boolean }
) {
  return useMyRequestTracking(requestId, options);
}
