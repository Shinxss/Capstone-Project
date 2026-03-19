import { MapPin, Phone, ShieldCheck } from "lucide-react";
import type { DispatchTask, TaskProof } from "../models/tasks.types";
import type { ForReviewChecklistItem, ForReviewQueueItem } from "../hooks/useLguTasksForReview";
import ForReviewChecklist from "./ForReviewChecklist";
import ForReviewProofGallery from "./ForReviewProofGallery";
import ForReviewVolunteerAvatar from "./ForReviewVolunteerAvatar";

type Props = {
  selectedTask: DispatchTask | null;
  selectedQueueItem: ForReviewQueueItem | null;
  verifyingId: string | null;
  verifyError: string | null;
  onVerify: (id: string) => Promise<void>;
  checklist: ForReviewChecklistItem[];
  reviewerNotes: string;
  onReviewerNotesChange: (value: string) => void;
  selectedProofs: TaskProof[];
  activeProofIndex: number;
  onSelectProofIndex: (index: number) => void;
  proofLoading: boolean;
  proofError: string | null;
  proofObjectUrl: string | null;
  proofPreviewUrls: Record<string, string>;
  onDownloadProof: () => void;
};

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString();
}

function reportedLabel(task: DispatchTask, queueItem: ForReviewQueueItem | null) {
  return formatDateTime(task.emergency?.reportedAt || queueItem?.submittedAt || task.createdAt || task.updatedAt);
}

function isMongoObjectId(value: string) {
  return /^[a-f0-9]{24}$/i.test(value.trim());
}

export default function ForReviewDetailsPanel({
  selectedTask,
  selectedQueueItem,
  verifyingId,
  verifyError,
  onVerify,
  checklist,
  reviewerNotes,
  onReviewerNotesChange,
  selectedProofs,
  activeProofIndex,
  onSelectProofIndex,
  proofLoading,
  proofError,
  proofObjectUrl,
  proofPreviewUrls,
  onDownloadProof,
}: Props) {
  if (!selectedTask) {
    return (
      <div className="bg-white p-8 dark:bg-[#0B1220]">
        <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-[#0E1626] dark:text-slate-400">
            <ShieldCheck size={20} />
          </div>
          <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">Select a task from the queue</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Task details, proof review, and verification actions will appear here.
          </div>
        </div>
      </div>
    );
  }

  const volunteerName = selectedTask.volunteer?.name?.trim() || "Unassigned volunteer";
  const emergencyType = selectedTask.emergency?.emergencyType?.trim() || "Unknown emergency";
  const taskId = String(selectedTask.id);
  const emergencyReference =
    String(selectedQueueItem?.emergencyReference ?? "").trim() ||
    String(selectedTask.emergency?.referenceNumber ?? "").trim();
  const barangay = selectedTask.emergency?.barangayName?.trim() || "Barangay unavailable";
  const volunteerAvatarUrl = selectedQueueItem?.volunteerAvatarUrl ?? null;
  const lifelineIdRaw =
    String(selectedQueueItem?.volunteerLifelineId ?? "").trim() ||
    String(selectedTask.volunteer?.lifelineId ?? "").trim() ||
    String(selectedTask.volunteer?.id ?? "").trim();
  const volunteerLifelineId = lifelineIdRaw && !isMongoObjectId(lifelineIdRaw) ? lifelineIdRaw : null;
  const reporterName = String(selectedQueueItem?.reporterName ?? "").trim() || "Reporter unavailable";
  const reporterAvatarUrl = selectedQueueItem?.reporterAvatarUrl ?? null;
  const reporterLifelineRaw = String(selectedQueueItem?.reporterLifelineId ?? "").trim();
  const reporterLifelineId = reporterLifelineRaw && !isMongoObjectId(reporterLifelineRaw) ? reporterLifelineRaw : null;
  const reporterContactNo = String(selectedQueueItem?.reporterContactNo ?? "").trim() || "Contact number unavailable";
  const reporterAddress = String(selectedQueueItem?.reporterAddress ?? "").trim() || "Address unavailable";
  const emergencySource = String(selectedTask.emergency?.source ?? "").trim().toUpperCase();
  const severityLabel = emergencySource.includes("SOS") ? "High" : "Normal";
  const reportedAtText = reportedLabel(selectedTask, selectedQueueItem);
  const isVerifying = verifyingId === taskId;

  return (
    <div className="space-y-0">
      <section className="border-b border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
        <div className="flex min-w-0 items-center gap-3">
          <ForReviewVolunteerAvatar name={volunteerName} avatarUrl={volunteerAvatarUrl} size="md" />
          <div className="min-w-0">
            <div className="truncate text-lg font-bold text-gray-900 dark:text-slate-100">{volunteerName}</div>
            <div className="mt-1 inline-flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-slate-300">Volunteer</span>
              <span className="inline-flex w-fit rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                Verified
              </span>
            </div>
            {volunteerLifelineId ? (
              <div className="mt-0.5 font-mono text-xs text-gray-500 dark:text-slate-500">Lifeline ID: {volunteerLifelineId}</div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 text-lg font-bold text-gray-900 dark:text-slate-100">{emergencyType} Incident</div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <span
              className={[
                "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                severityLabel === "High"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                  : "bg-gray-100 text-gray-700 dark:bg-[#101A30] dark:text-slate-200",
              ].join(" ")}
            >
              Severity: {severityLabel}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Location</div>
          <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">{barangay}</div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700 dark:text-slate-300">
          <div className="font-mono text-xs text-gray-600 dark:text-slate-400">ID: {emergencyReference || "REFERENCE-UNAVAILABLE"}</div>
        </div>

        <div className="mt-2 text-right text-xs font-medium text-gray-500 dark:text-slate-400">Reported: {reportedAtText}</div>
      </section>

      <ForReviewProofGallery
        proofs={selectedProofs}
        activeProofIndex={activeProofIndex}
        onSelectProofIndex={onSelectProofIndex}
        proofLoading={proofLoading}
        proofError={proofError}
        proofObjectUrl={proofObjectUrl}
        proofPreviewUrls={proofPreviewUrls}
        onDownloadProof={onDownloadProof}
      />

      <section className="border-b border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Reporter</h3>
        <div className="mt-3 flex items-start gap-3">
          <ForReviewVolunteerAvatar name={reporterName} avatarUrl={reporterAvatarUrl} size="md" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-900 dark:text-slate-100">{reporterName}</div>
            {reporterLifelineId ? (
              <div className="mt-0.5 font-mono text-xs text-gray-500 dark:text-slate-500">Lifeline ID: {reporterLifelineId}</div>
            ) : null}
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 text-xs text-gray-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Phone size={13} />
            <span>{reporterContactNo}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin size={13} className="mt-0.5" />
            <span>{reporterAddress}</span>
          </div>
        </div>
      </section>

      {selectedTask.emergency?.notes ? (
        <section className="border-b border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Emergency Notes / Context</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-slate-300">{selectedTask.emergency.notes}</p>
        </section>
      ) : null}

      <ForReviewChecklist items={checklist} />

      <section className="border-b border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Reviewer Notes (not yet saved)</h3>
        <div className="mt-2 text-xs text-gray-500 dark:text-slate-400">
          Local draft only. Notes are not persisted by the backend yet.
        </div>
        <textarea
          value={reviewerNotes}
          onChange={(e) => onReviewerNotesChange(e.target.value)}
          rows={4}
          placeholder="Write your review notes..."
          className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300 focus-visible:ring-2 focus-visible:ring-red-500/40 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100 dark:placeholder:text-slate-500"
        />

        {verifyError ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
            {verifyError}
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void onVerify(taskId)}
            disabled={isVerifying}
            className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isVerifying ? "Verifying..." : "Approve / Verify"}
          </button>
          <button
            type="button"
            disabled
            title="Not available yet"
            className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-gray-500 opacity-70 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-400"
          >
            Request Clarification
          </button>
          <button
            type="button"
            disabled
            title="Not available yet"
            className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-gray-500 opacity-70 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-400"
          >
            Reject
          </button>
        </div>
      </section>
    </div>
  );
}
