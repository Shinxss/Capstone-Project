import { FileText } from "lucide-react";

export default function ReportDescriptionCard({ description }: { description: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#1C2940] dark:bg-[#0B1220]">
      <h2 className="flex items-center gap-3 text-base font-bold text-slate-950 dark:text-white"><FileText size={19} /> Description</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
    </section>
  );
}
