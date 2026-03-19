import { Download, ImageOff, Loader2 } from "lucide-react";
import type { TaskProof } from "../models/tasks.types";

type Props = {
  proofs: TaskProof[];
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

export default function ForReviewProofGallery({
  proofs,
  activeProofIndex,
  onSelectProofIndex,
  proofLoading,
  proofError,
  proofObjectUrl,
  proofPreviewUrls,
  onDownloadProof,
}: Props) {
  const hasProofs = proofs.length > 0;
  const activeProof = proofs[activeProofIndex] ?? null;

  return (
    <section className="border-b border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Proof Images</h3>
          <div className="text-xs text-gray-500 dark:text-slate-400">
            {proofs.length} proof file{proofs.length === 1 ? "" : "s"} submitted
          </div>
        </div>
        <button
          type="button"
          onClick={onDownloadProof}
          disabled={!proofObjectUrl}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
        >
          <Download size={14} />
          Download
        </button>
      </div>

      {!hasProofs ? (
        <div className="mt-3 flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-100 px-4 text-center dark:border-[#2A3D63] dark:bg-[#0E1626]">
          <ImageOff size={20} className="text-gray-400 dark:text-slate-500" />
          <div className="mt-2 text-sm font-semibold text-gray-700 dark:text-slate-200">No proof uploaded yet</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">Volunteer submitted this task without proof files.</div>
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {proofs.map((proof, index) => (
              <div key={`${proof.url}-${index}`}>
                <button
                  type="button"
                  onClick={() => onSelectProofIndex(index)}
                  className={[
                    "group w-full rounded-lg border p-1.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50",
                    index === activeProofIndex
                      ? "border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:hover:border-[#22365D] dark:hover:bg-[#122036]",
                  ].join(" ")}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-gray-200 dark:bg-[#1A2948]">
                    {proofPreviewUrls[proof.url] ? (
                      <img
                        src={proofPreviewUrls[proof.url]}
                        alt={`Proof ${index + 1}`}
                        className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.01]"
                      />
                    ) : index === activeProofIndex && proofLoading ? (
                      <div className="flex h-full items-center justify-center gap-2 text-xs text-gray-600 dark:text-slate-300">
                        <Loader2 size={14} className="animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-medium text-gray-500 dark:text-slate-400">
                        Tap to load proof
                      </div>
                    )}
                  </div>
                </button>
                <div className="mt-1.5 text-[11px] text-gray-500 dark:text-slate-400">
                  {activeProofIndex === index ? "Selected" : `Proof ${index + 1}`} - {formatDateTime(proof.uploadedAt)}
                </div>
              </div>
            ))}
          </div>

          {activeProof && proofError ? (
            <div className="mt-2 text-xs text-red-700 dark:text-red-300">Unable to load selected proof: {proofError}</div>
          ) : null}
        </>
      )}
    </section>
  );
}
