import { ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import type { ResolvedApprovalPhoto } from "../hooks/useApprovalEvidence";

export default function ApprovalEvidenceLightbox({
  photos,
  activeIndex,
  onIndexChange,
  onClose,
}: {
  photos: ResolvedApprovalPhoto[];
  activeIndex: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const active = activeIndex === null ? null : photos[activeIndex];
  return (
    <Modal open={Boolean(active)} title="Media Evidence" onClose={onClose} maxWidthClassName="max-w-5xl">
      {active ? (
        <div>
          <div className="relative flex min-h-[55vh] items-center justify-center overflow-hidden rounded-xl bg-slate-950">
            <img src={active.src} alt={`Emergency evidence ${activeIndex! + 1}`} className="max-h-[70vh] max-w-full object-contain" />
            {photos.length > 1 ? (
              <>
                <button type="button" aria-label="Previous photo" onClick={() => onIndexChange((activeIndex! - 1 + photos.length) % photos.length)} className="absolute left-3 grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white hover:bg-black/70"><ChevronLeft /></button>
                <button type="button" aria-label="Next photo" onClick={() => onIndexChange((activeIndex! + 1) % photos.length)} className="absolute right-3 grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white hover:bg-black/70"><ChevronRight /></button>
              </>
            ) : null}
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">{activeIndex! + 1} of {photos.length}</p>
        </div>
      ) : null}
    </Modal>
  );
}
