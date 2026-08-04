import { BadgeCheck } from "lucide-react";

export default function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
      <BadgeCheck size={13} aria-hidden="true" />
      VERIFIED
    </span>
  );
}
