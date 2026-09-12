import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  EmergencyApprovalDetailResponse,
  EmergencyApprovalItem,
} from "../models/approvals.types";
import { fetchEmergencyApprovalDetail } from "../services/approvalsApi";
import { mergeApprovalDetail } from "../utils/approval.utils";

export function useApprovalDetails(reportId: string | undefined, feedItem?: EmergencyApprovalItem) {
  const [detail, setDetail] = useState<EmergencyApprovalDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!reportId) {
      setDetail(null);
      setError("Report not found");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setDetail(await fetchEmergencyApprovalDetail(reportId));
    } catch (caught: unknown) {
      const withResponse = caught as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      const message =
        withResponse.response?.status === 404
          ? "Report not found"
          : withResponse.response?.data?.message || withResponse.message || "Failed to load report details";
      setError(message);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const item = useMemo(
    () => (detail ? mergeApprovalDetail(detail, feedItem) : feedItem || null),
    [detail, feedItem]
  );

  return { item, loading, error, refresh };
}
