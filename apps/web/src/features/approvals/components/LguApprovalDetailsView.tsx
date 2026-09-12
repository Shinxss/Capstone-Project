import { useState } from "react";
import { ArrowLeft, Check, FileQuestion, X } from "lucide-react";
import type { EmergencyApprovalItem } from "../models/approvals.types";
import { useApprovalEvidence } from "../hooks/useApprovalEvidence";
import ApprovalEvidenceLightbox from "./ApprovalEvidenceLightbox";
import ApprovalRejectModal from "./ApprovalRejectModal";
import MediaEvidenceCard from "./MediaEvidenceCard";
import ReportDescriptionCard from "./ReportDescriptionCard";
import ReportHeaderCard from "./ReportHeaderCard";
import ReportLocationCard from "./ReportLocationCard";
import ReporterInfoCard from "./ReporterInfoCard";
import VerificationNotes from "./VerificationNotes";
import VerificationTimeline from "./VerificationTimeline";

type Props = {
  item: EmergencyApprovalItem | null;
  loading: boolean;
  error: string | null;
  approving: boolean;
  rejecting: boolean;
  onBack: () => void;
  onOpenMap: () => void;
  onApprove: () => Promise<boolean>;
  onReject: (reason: string) => Promise<boolean>;
  validateRejectReason: (reason: string) => { ok: boolean; error: string };
};

function DetailsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 w-60 rounded-lg bg-slate-200" />
      <div className="h-36 rounded-xl border border-slate-200 bg-white" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(320px,1fr)]">
        <div className="h-80 rounded-xl border border-slate-200 bg-white" />
        <div className="h-80 rounded-xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}

export default function LguApprovalDetailsView({
  item,
  loading,
  error,
  approving,
  rejecting,
  onBack,
  onOpenMap,
  onApprove,
  onReject,
  validateRejectReason,
}: Props) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const { photos, loading: photosLoading } = useApprovalEvidence(item?.photos || []);

  if (loading && !item) return <div className="min-h-full bg-slate-50 p-6"><DetailsSkeleton /></div>;

  if (!item || error) {
    return (
      <div className="grid min-h-full place-items-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
          <FileQuestion size={38} className="mx-auto text-slate-400" />
          <h1 className="mt-4 text-lg font-bold text-slate-950">Report not found</h1>
          <p className="mt-1 text-sm text-slate-500">{error || "This emergency report is no longer available."}</p>
          <button type="button" onClick={onBack} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <ArrowLeft size={16} /> Back to Approvals
          </button>
        </div>
      </div>
    );
  }

  const pending = item.status === "pending";
  return (
    <div className="min-h-full bg-slate-50 px-5 py-4 text-slate-900 lg:px-6">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={onBack} className="inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100">
            <ArrowLeft size={17} /> Back to Approvals / Verification
          </button>
          {pending ? (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => void onApprove()} disabled={approving || rejecting} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
                <Check size={18} /> {approving ? "Approving..." : "Approve"}
              </button>
              <button type="button" onClick={() => setRejectOpen(true)} disabled={approving || rejecting} className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                <X size={18} /> Reject
              </button>
            </div>
          ) : null}
        </div>

        <ReportHeaderCard item={item} photos={photos} photosLoading={photosLoading} onOpenPhoto={setActivePhotoIndex} />

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(320px,1fr)]">
          <div className="space-y-4">
            <ReportDescriptionCard description={item.description} />
            <MediaEvidenceCard total={item.photos.length} photos={photos} loading={photosLoading} onOpen={setActivePhotoIndex} />
            <VerificationTimeline item={item} />
          </div>
          <div className="space-y-4">
            <ReportLocationCard item={item} onOpenMap={onOpenMap} />
            <ReporterInfoCard item={item} />
            <VerificationNotes />
          </div>
        </div>
      </div>

      <ApprovalRejectModal
        open={rejectOpen}
        busy={rejecting}
        validate={validateRejectReason}
        onClose={() => setRejectOpen(false)}
        onConfirm={onReject}
      />
      <ApprovalEvidenceLightbox
        photos={photos}
        activeIndex={activePhotoIndex}
        onIndexChange={setActivePhotoIndex}
        onClose={() => setActivePhotoIndex(null)}
      />
    </div>
  );
}
