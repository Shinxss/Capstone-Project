import {
  Activity,
  CloudLightning,
  Flame,
  HeartPulse,
  Siren,
  TriangleAlert,
  Waves,
  type LucideIcon,
} from "lucide-react";

type BadgeStyle = { icon: LucideIcon; className: string };

const styles: Record<string, BadgeStyle> = {
  SOS: { icon: Siren, className: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300" },
  FIRE: { icon: Flame, className: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300" },
  MEDICAL: { icon: HeartPulse, className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" },
  FLOOD: { icon: Waves, className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300" },
  TYPHOON: { icon: CloudLightning, className: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300" },
  EARTHQUAKE: { icon: Activity, className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300" },
};

const fallbackStyle: BadgeStyle = {
  icon: TriangleAlert,
  className: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300",
};

export default function EmergencyTypeBadge({ type }: { type?: string | null }) {
  const normalized = String(type ?? "Emergency").trim().toUpperCase() || "EMERGENCY";
  const style = styles[normalized] ?? fallbackStyle;
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${style.className}`}>
      <Icon size={14} aria-hidden="true" />
      {normalized}
    </span>
  );
}
