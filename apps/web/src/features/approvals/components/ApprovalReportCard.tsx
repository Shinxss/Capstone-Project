import {
  CalendarDays,
  Check,
  Image as ImageIcon,
  MapPin,
  UserRound,
  X,
} from "lucide-react";
import { useApprovalEvidence } from "../hooks/useApprovalEvidence";
import type { EmergencyApprovalItem } from "../models/approvals.types";
import { approvalLocation, formatApprovalRole } from "../utils/approval.utils";
import ApprovalStatusBadge from "./ApprovalStatusBadge";
import SeverityBadge from "./SeverityBadge";

type Props = {
  item: EmergencyApprovalItem;
  approving: boolean;
  rejecting: boolean;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
};

function formatReportedAt(value?: string) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function EvidenceThumbnail({ item }: { item: EmergencyApprovalItem }) {
  const { photos, loading } = useApprovalEvidence(item.photos, 1);
  const source = photos[0]?.src;

  return (
    <div className="relative h-28 overflow-hidden rounded-lg bg-slate-100 xl:h-[86px] xl:w-[148px] xl:shrink-0">
      {source ? (
        <img src={source} alt={`${item.title} evidence`} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center bg-slate-100 text-slate-400">
          <ImageIcon size={28} className={loading ? "animate-pulse" : ""} />
        </div>
      )}
      <div className="absolute bottom-2 left-2">
        <SeverityBadge severity={item.severity} />
      </div>
    </div>
  );
}

export default function ApprovalReportCard({
  item,
  approving,
  rejecting,
  onView,
  onApprove,
  onReject,
}: Props) {
  const pending = item.status === "pending";
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-2.5 transition hover:border-slate-300">
      <div className="grid gap-3 xl:grid-cols-[148px_minmax(250px,1fr)_160px_176px_minmax(210px,auto)] xl:items-center">
        <EvidenceThumbnail item={item} />

        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-slate-950">{item.title}</h3>
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-slate-600">
            <MapPin size={13} className="shrink-0 text-slate-700" />
            <span className="truncate">{approvalLocation(item)}</span>
          </p>
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-slate-500">{item.description}</p>
        </div>

        <div className="flex min-w-0 items-start gap-2 text-[11px] text-slate-600">
          <UserRound size={14} className="mt-0.5 shrink-0 text-slate-700" />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500">Reported by</p>
            <p className="truncate font-semibold text-slate-800">{item.reporter.name}</p>
            <p className="truncate text-[10px] text-slate-500">{formatApprovalRole(item.reporter.role, item.reporter.isGuest)}</p>
          </div>
        </div>

        <div className="min-w-0 text-[10px] text-slate-600">
          <p className="flex items-center gap-1.5 whitespace-nowrap">
            <CalendarDays size={13} className="shrink-0 text-slate-700" />
            {formatReportedAt(item.reportedAt || item.createdAt)}
          </p>
          <span className="mt-2 inline-flex max-w-full truncate rounded-md bg-blue-50 px-2 py-1 font-medium text-blue-700">
            Ref: {item.referenceNumber}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
          <ApprovalStatusBadge status={item.status} />
          <div className="flex w-full flex-wrap items-center gap-2 xl:justify-end">
            <button
              type="button"
              onClick={onView}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-blue-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              View Details
            </button>
            {pending ? (
              <>
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={approving || rejecting}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Check size={14} /> {approving ? "Approving..." : "Approve"}
                </button>
                <button
                  type="button"
                  onClick={onReject}
                  disabled={approving || rejecting}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-[11px] font-bold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  <X size={14} /> {rejecting ? "Rejecting..." : "Reject"}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
