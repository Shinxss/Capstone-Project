import { Star } from "lucide-react";

export default function ResponderRating({ rating, reviewCount }: { rating: number | null; reviewCount: number | null }) {
  if (rating === null) {
    return (
      <div aria-label="Responder rating unavailable" className="text-right">
        <div className="flex items-center justify-end gap-1 text-sm font-bold text-slate-400"><Star size={15} />—</div>
        <div className="mt-0.5 text-[10px] text-slate-400">No rating data</div>
      </div>
    );
  }
  const rounded = Math.round(rating);
  return (
    <div aria-label={`${rating.toFixed(1)} out of 5 stars${reviewCount !== null ? ` from ${reviewCount} reviews` : ""}`} className="text-right">
      <div className="text-base font-bold text-slate-900 dark:text-white">{rating.toFixed(1)}</div>
      <div className="mt-0.5 flex justify-end gap-0.5 text-amber-400" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => <Star key={index} size={12} fill={index < rounded ? "currentColor" : "none"} />)}
      </div>
      <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{reviewCount === null ? "Reviews unavailable" : `${reviewCount} reviews`}</div>
    </div>
  );
}
