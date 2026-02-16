import { useCallback } from "react";

export function useLguPlaceholder(title: string) {
  const refetch = useCallback(() => {
    // Placeholder page has no data source yet.
  }, []);

  return {
    loading: false,
    error: null as string | null,
    refetch,
    title,
  };
}
