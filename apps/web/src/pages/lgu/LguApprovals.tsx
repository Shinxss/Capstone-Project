import LguShell from "../../components/lgu/LguShell";
import LguApprovalsView from "../../features/approvals/components/LguApprovalsView";
import { useLguApprovals } from "../../features/approvals/hooks/useLguApprovals";

export default function LguApprovals() {
  const vm = useLguApprovals();

  return (
    <LguShell title="Approvals / Verification" subtitle="Emergency verification only (dispatch completion)">
      <LguApprovalsView {...vm} loading={vm.loading} error={vm.error} onRefresh={vm.refetch} />
    </LguShell>
  );
}
