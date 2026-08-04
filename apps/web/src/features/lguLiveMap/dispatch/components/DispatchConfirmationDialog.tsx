import { AlertTriangle, LoaderCircle, Send } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../components/ui/alert-dialog";
import type { DispatchableResponder, DispatchEmergencyContext } from "../types/dispatchResponders.types";

export default function DispatchConfirmationDialog({
  open,
  emergency,
  responders,
  submitting,
  error,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  emergency: DispatchEmergencyContext;
  responders: DispatchableResponder[];
  submitting: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => { if (!submitting) onOpenChange(nextOpen); }}>
      <AlertDialogContent className="border-slate-200 bg-white dark:border-[#2B3A55] dark:bg-[#0B1220]">
        <AlertDialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"><AlertTriangle size={23} /></div>
          <AlertDialogTitle className="text-slate-950 dark:text-white">Confirm responder dispatch</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600 dark:text-slate-300">
            Dispatch {responders.length} {responders.length === 1 ? "responder" : "responders"} to the {emergency.title} at {emergency.location}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-[#263651] dark:bg-[#101A2B]">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Selected responders</p>
          <ul className="mt-2 space-y-1 text-sm font-medium text-slate-800 dark:text-slate-200">{responders.map((responder) => <li key={responder.id}>{responder.name}</li>)}</ul>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Responders will immediately receive the assignment. Availability and authorization are revalidated by the server.</p>
        {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300" role="alert">{error}</p> : null}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <button type="button" onClick={() => onOpenChange(false)} disabled={submitting} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 dark:border-[#2B3A55] dark:text-slate-200 dark:hover:bg-[#17243A]">Go Back</button>
          <button type="button" onClick={onConfirm} disabled={submitting || responders.length === 0} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50">{submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}{submitting ? "Dispatching…" : "Confirm Dispatch"}</button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
