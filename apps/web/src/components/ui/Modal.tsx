import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  maxWidthClassName?: string; // e.g. "max-w-3xl"
};

export default function Modal({
  open,
  title,
  subtitle,
  children,
  footer,
  onClose,
  maxWidthClassName = "max-w-lg",
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        className={[
          "relative w-full",
          maxWidthClassName,
          "rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden",
          "dark:bg-[#0B1220] dark:border-[#162544] dark:shadow-black/40",
        ].join(" ")}
      >
        <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between dark:border-[#162544]">
          <div className="min-w-0">
            <div className="text-base font-extrabold text-gray-900 dark:text-slate-100 truncate">
              {title}
            </div>
            {subtitle ? (
              <div className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">{subtitle}</div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-4 h-9 w-9 shrink-0 rounded-lg hover:bg-gray-100 grid place-items-center text-gray-700 dark:text-slate-200 dark:hover:bg-[#122036]"
            aria-label="Close modal"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">{children}</div>

        {footer ? (
          <div className="px-5 py-4 border-t border-gray-200 dark:border-[#162544]">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

