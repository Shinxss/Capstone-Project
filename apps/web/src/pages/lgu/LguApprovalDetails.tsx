import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LguShell from "../../components/lgu/LguShell";
import LguApprovalDetailsView from "../../features/approvals/components/LguApprovalDetailsView";
import { useApprovalDetails } from "../../features/approvals/hooks/useApprovalDetails";
import { useLguApprovals } from "../../features/approvals/hooks/useLguApprovals";

export default function LguApprovalDetails() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const approvals = useLguApprovals();
  const feedItem = useMemo(
    () => approvals.items.find((item) => item.incidentId === reportId),
    [approvals.items, reportId]
  );
  const details = useApprovalDetails(reportId, feedItem);

  return (
    <LguShell title="Report Details" subtitle="Emergency report verification" hideHeaderContext>
      <LguApprovalDetailsView
        item={details.item}
        loading={details.loading}
        error={details.error}
        approving={approvals.verifyingId === reportId}
        rejecting={approvals.rejectingId === reportId}
        validateRejectReason={approvals.validateRejectReason}
        onBack={() => navigate("/lgu/approvals")}
        onOpenMap={() => navigate(`/lgu/live-map?emergencyId=${encodeURIComponent(reportId || "")}`)}
        onApprove={async () => {
          if (!reportId) return false;
          const succeeded = await approvals.verify(reportId);
          if (succeeded) await details.refresh();
          return succeeded;
        }}
        onReject={async (reason) => {
          if (!reportId) return false;
          const succeeded = await approvals.reject(reportId, reason);
          if (succeeded) await details.refresh();
          return succeeded;
        }}
      />
    </LguShell>
  );
}
