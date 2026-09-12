import { createElement } from "react";
import { CalendarDays, FileText, Image as ImageIcon, MapPin } from "lucide-react";
import { iconForEmergency, normalizeEmergencyType } from "../../emergency/constants/emergency.constants";
import type { ResolvedApprovalPhoto } from "../hooks/useApprovalEvidence";
import type { EmergencyApprovalItem } from "../models/approvals.types";
import { approvalLocation, formatApprovalDate } from "../utils/approval.utils";
import ApprovalStatusBadge from "./ApprovalStatusBadge";
import SeverityBadge from "./SeverityBadge";

export default function ReportHeaderCard({
  item,
  photos,
  photosLoading,
  onOpenPhoto,
}: {
  item: EmergencyApprovalItem;
  photos: ResolvedApprovalPhoto[];
  photosLoading: boolean;
  onOpenPhoto: (index: number) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <button
          type="button"
          onClick={() => photos[0] && onOpenPhoto(0)}
          disabled={!photos[0]}
          className="relative h-44 overflow-hidden rounded-xl bg-slate-100 text-slate-400 md:h-[132px] md:w-[218px] md:shrink-0"
        >
          {photos[0] ? (
            <img src={photos[0].src} alt={`${item.title} evidence`} className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full place-items-center"><ImageIcon size={36} className={photosLoading ? "animate-pulse" : ""} /></span>
          )}
          <span className="absolute bottom-2 left-2"><SeverityBadge severity={item.severity} detailed /></span>
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-950 lg:text-2xl">{item.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FileText size={16} /> Ref: {item.referenceNumber}
            </span>
            <ApprovalStatusBadge status={item.status} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2">
              {createElement(iconForEmergency(normalizeEmergencyType(item.type)), { size: 17, className: "text-slate-800" })}
              {item.type}
            </span>
            <span className="inline-flex items-center gap-2"><CalendarDays size={17} className="text-slate-800" /> Reported on {formatApprovalDate(item.reportedAt || item.createdAt)}</span>
            <span className="inline-flex items-center gap-2"><MapPin size={17} className="text-slate-800" /> {approvalLocation(item)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
