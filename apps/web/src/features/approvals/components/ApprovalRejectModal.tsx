import { useState } from "react";
import Modal from "../../../components/ui/Modal";

type Props = {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<boolean | void>;
  validate: (reason: string) => { ok: boolean; error: string };
};

export default function ApprovalRejectModal({ open, busy, onClose, onConfirm, validate }: Props) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const close = () => {
    if (busy) return;
    setReason("");
    setReasonError("");
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Reject Emergency Report"
      subtitle="Provide a clear reason for the reporter and audit record."
      onClose={close}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            disabled={busy}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-[#2A3954] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              const result = validate(reason);
              if (!result.ok) {
                setReasonError(result.error);
                return;
              }
              setReasonError("");
              const succeeded = await onConfirm(reason.trim());
              if (succeeded !== false) close();
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? "Rejecting..." : "Reject Report"}
          </button>
        </div>
      }
    >
      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="approval-rejection-reason">
        Rejection reason
      </label>
      <textarea
        id="approval-rejection-reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={4}
        maxLength={500}
        placeholder="Explain why this emergency report cannot be approved..."
        className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-[#24324A] dark:bg-[#0E1626] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-red-500/20"
      />
      <div className="mt-1 flex justify-between gap-3">
        <p className="text-xs text-red-600 dark:text-red-300">{reasonError}</p>
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{reason.length}/500</span>
      </div>
    </Modal>
  );
}
