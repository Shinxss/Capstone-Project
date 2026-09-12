import { Image as ImageIcon } from "lucide-react";
import type { ResolvedApprovalPhoto } from "../hooks/useApprovalEvidence";

export default function MediaEvidenceCard({
  total,
  photos,
  loading,
  onOpen,
}: {
  total: number;
  photos: ResolvedApprovalPhoto[];
  loading: boolean;
  onOpen: (index: number) => void;
}) {
  const showOverflow = total > 4;
  const visible = photos.slice(0, showOverflow ? 3 : 4);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-[#1C2940] dark:bg-[#0B1220]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-base font-bold text-slate-950 dark:text-white"><ImageIcon size={19} /> Media Evidence ({total})</h2>
        {total > 0 ? <button type="button" onClick={() => onOpen(0)} className="text-xs font-semibold text-red-600 hover:text-red-700">View All</button> : null}
      </div>
      {loading ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: Math.min(Math.max(total, 1), 4) }, (_, index) => <div key={index} className="aspect-[4/3] animate-pulse rounded-lg bg-slate-100 dark:bg-[#18243A]" />)}
        </div>
      ) : visible.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {visible.map((photo, index) => (
            <button type="button" key={photo.key} onClick={() => onOpen(index)} className="aspect-[4/3] overflow-hidden rounded-lg bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-[#121D30]">
              <img src={photo.src} alt={`Emergency evidence ${index + 1}`} className="h-full w-full object-cover transition hover:scale-105" />
            </button>
          ))}
          {showOverflow ? (
            <button type="button" onClick={() => onOpen(3)} className="grid aspect-[4/3] place-items-center rounded-lg border border-slate-200 bg-slate-50 text-xl font-bold text-blue-600 hover:bg-blue-50 dark:border-[#24324A] dark:bg-[#0E1626] dark:text-blue-300 dark:hover:bg-blue-500/10">
              +{total - 3}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 grid min-h-28 place-items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-500 dark:border-[#24324A] dark:bg-[#0E1626] dark:text-slate-400">
          No media evidence attached
        </div>
      )}
    </section>
  );
}
