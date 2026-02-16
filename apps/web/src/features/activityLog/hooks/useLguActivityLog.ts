import { useActivityLog } from "./useActivityLog";

export function useLguActivityLog() {
  const vm = useActivityLog();

  return {
    ...vm,
    loading: vm.loading,
    error: vm.error,
    refetch: vm.refresh,
  };
}
