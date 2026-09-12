import type { EmergencyApprovalSeverity } from "../models/approvals.types";

const styles: Record<EmergencyApprovalSeverity, string> = {
  high: "bg-red-600 text-white",
  medium: "bg-orange-500 text-white",
  low: "bg-blue-600 text-white",
};

export default function SeverityBadge({
  severity,
  detailed = false,
}: {
  severity: EmergencyApprovalSeverity;
  detailed?: boolean;
}) {
  const label = `${severity.charAt(0).toUpperCase()}${severity.slice(1)}${detailed ? " Severity" : ""}`;
  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-bold shadow-sm ${styles[severity]}`}>
      {label}
    </span>
  );
}
