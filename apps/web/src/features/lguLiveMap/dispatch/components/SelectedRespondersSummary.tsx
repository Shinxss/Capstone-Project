import { Send, X } from "lucide-react";
import type { DispatchableResponder } from "../types/dispatchResponders.types";
import ResponderAvatar from "./ResponderAvatar";

export default function SelectedRespondersSummary({
  selectedResponders,
  selectionIsValid,
  emergencyDispatchable,
  submitting,
  onClear,
  onCancel,
  onDispatch,
}: {
  selectedResponders: DispatchableResponder[];
  selectionIsValid: boolean;
  emergencyDispatchable: boolean;
  submitting: boolean;
  onClear: () => void;
  onCancel: () => void;
  onDispatch: () => void;
}) {
  const names = selectedResponders.map((responder) => responder.name).join(", ");
  const disabled = selectedResponders.length === 0 || !selectionIsValid || !emergencyDispatchable || submitting;
  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] dark:border-[#1D2B43] dark:bg-[#0B1220] sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedResponders.length} {selectedResponders.length === 1 ? "responder" : "responders"} selected</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex -space-x-2" title={names || "No responders selected"}>
              {selectedResponders.slice(0, 4).map((responder) => <span key={responder.id} className="rounded-xl ring-2 ring-white dark:ring-[#0B1220]"><ResponderAvatar name={responder.name} avatarUrl={responder.avatarUrl} size="sm" /></span>)}
              {selectedResponders.length > 4 ? <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-bold text-slate-600 ring-2 ring-white dark:bg-[#17243A] dark:text-slate-200 dark:ring-[#0B1220]">+{selectedResponders.length - 4}</span> : null}
            </div>
            {selectedResponders.length > 0 ? <button type="button" onClick={onClear} disabled={submitting} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"><X size={13} />Clear all</button> : null}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button type="button" onClick={onCancel} disabled={submitting} className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 dark:border-[#2B3A55] dark:text-slate-200 dark:hover:bg-[#17243A]">Cancel</button>
          <button type="button" onClick={onDispatch} disabled={disabled} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><Send size={16} />Dispatch Now</button>
        </div>
      </div>
      {!selectionIsValid && selectedResponders.length > 0 ? <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300" role="alert">Selection changed because a responder is no longer dispatchable.</p> : null}
    </footer>
  );
}
