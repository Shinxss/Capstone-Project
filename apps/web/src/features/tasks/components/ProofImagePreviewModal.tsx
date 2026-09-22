import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Loader2,
} from "lucide-react";
import type { TaskProof } from "../models/tasks.types";

export type ProofImagePreviewModalProps = {
  open: boolean;
  proofs: TaskProof[];
  activeIndex: number;
  previewUrls: Record<string, string>;
  onActiveIndexChange: (index: number) => void;
  onClose: () => void;
  onDownload: () => void;
};

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return null;
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toLocaleString();
}

export default function ProofImagePreviewModal({
  open,
  proofs,
  activeIndex,
  previewUrls,
  onActiveIndexChange,
  onClose,
  onDownload,
}: ProofImagePreviewModalProps) {
  const [zoom, setZoom] = useState(1);

  const activeProof = proofs[activeIndex] ?? null;
  const currentUrl = activeProof?.url ? previewUrls[activeProof.url] ?? null : null;
  const totalProofs = proofs.length;
  const uploadedAtText = formatDateTime(activeProof?.uploadedAt);

  // Reset zoom on open or when active proof changes without useEffect
  const [prevKey, setPrevKey] = useState<string | null>(null);
  const currentKey = open ? `${activeIndex}` : null;

  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    setZoom(1);
  }

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(4, Math.round((z + 0.25) * 100) / 100));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(1, Math.round((z - 0.25) * 100) / 100));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const handlePrev = useCallback(() => {
    if (activeIndex > 0) {
      onActiveIndexChange(activeIndex - 1);
    }
  }, [activeIndex, onActiveIndexChange]);

  const handleNext = useCallback(() => {
    if (activeIndex < totalProofs - 1) {
      onActiveIndexChange(activeIndex + 1);
    }
  }, [activeIndex, totalProofs, onActiveIndexChange]);

  // Keyboard navigation & controls
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, handlePrev, handleNext, handleZoomIn, handleZoomOut, handleResetZoom]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Proof Image Preview"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/85 backdrop-blur-md p-3 sm:p-5 select-none animate-in fade-in duration-200"
    >
      {/* Top Header */}
      <div className="flex w-full items-center justify-between border-b border-white/10 pb-3 text-white">
        <div className="min-w-0 pr-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold truncate">
              {activeProof?.fileName || `Proof Image ${activeIndex + 1}`}
            </h2>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white/90">
              Evidence
            </span>
          </div>
          {uploadedAtText ? (
            <p className="mt-0.5 text-xs text-white/60">Submitted: {uploadedAtText}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          aria-label="Close proof preview"
          title="Close (Esc)"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Image Viewing Container */}
      <div
        className="relative my-3 flex flex-1 min-h-0 w-full items-center justify-center overflow-auto rounded-2xl bg-black/40 border border-white/10 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {currentUrl ? (
          <div
            className="flex items-center justify-center transition-transform duration-150 ease-out"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            <img
              src={currentUrl}
              alt={activeProof?.fileName || `Proof ${activeIndex + 1}`}
              className="max-h-[68vh] max-w-[88vw] object-contain select-none rounded-lg shadow-2xl"
              draggable={false}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-white/70">
            <Loader2 size={32} className="animate-spin text-red-500" />
            <span className="text-xs font-medium">Loading proof evidence...</span>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-white shadow-xl backdrop-blur-lg">
        {/* Pagination Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={activeIndex === 0}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Previous proof"
            title="Previous (Arrow Left)"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <span className="px-2 font-mono text-xs font-bold text-white/90">
            {activeIndex + 1} / {totalProofs}
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={activeIndex >= totalProofs - 1}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Next proof"
            title="Next (Arrow Right)"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="hidden h-5 w-[1px] bg-white/20 sm:block" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Zoom out"
            title="Zoom out (-)"
          >
            <ZoomOut size={16} />
          </button>

          <span className="w-14 text-center font-mono text-xs font-bold text-white/90">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Zoom in"
            title="Zoom in (+)"
          >
            <ZoomIn size={16} />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            disabled={zoom === 1}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Reset zoom"
            title="Reset zoom (0)"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        <div className="hidden h-5 w-[1px] bg-white/20 sm:block" />

        {/* Download Action */}
        <button
          type="button"
          onClick={onDownload}
          disabled={!currentUrl}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-bold text-white shadow transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          aria-label="Download proof image"
          title="Download current proof"
        >
          <Download size={14} />
          Download
        </button>
      </div>
    </div>,
    document.body
  );
}
