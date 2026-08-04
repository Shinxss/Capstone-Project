import type { RecommendationLabel } from "../types/dispatchResponders.types";

const styles: Record<RecommendationLabel, string> = {
  "Best Match": "bg-red-600 text-white",
  Nearby: "bg-blue-600 text-white",
  "Skill Match": "bg-amber-500 text-white",
};

export default function RecommendationBadge({ label }: { label: RecommendationLabel | null }) {
  if (!label) return null;
  return <span className={`absolute -left-px -top-px rounded-br-lg rounded-tl-[15px] px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide ${styles[label]}`}>{label}</span>;
}
