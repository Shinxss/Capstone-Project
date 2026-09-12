import { useState } from "react";
import { FilePenLine } from "lucide-react";

export default function VerificationNotes() {
  // TODO: Persist verification notes when a supported backend field/API is available.
  const [notes, setNotes] = useState("");
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-[#1C2940] dark:bg-[#0B1220]">
      <h2 className="flex items-center gap-3 text-base font-bold text-slate-950 dark:text-white"><FilePenLine size={19} /> Additional Notes (Optional)</h2>
      <textarea
        value={notes}
        maxLength={500}
        rows={3}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Add notes about verification, actions taken, or other details..."
        className="mt-4 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-[#24324A] dark:bg-[#0E1626] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-500/20"
      />
      <p className="mt-1 text-right text-xs text-slate-400 dark:text-slate-500">{notes.length}/500</p>
    </section>
  );
}
