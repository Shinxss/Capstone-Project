import { useEmergencyVerification } from "./useEmergencyVerification";

export function useLguApprovals() {
  const vm = useEmergencyVerification();

  return {
    ...vm,
    refetch: vm.refresh,
  };
}
