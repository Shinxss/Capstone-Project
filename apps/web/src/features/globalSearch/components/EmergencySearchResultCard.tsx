import { useMemo, useState } from "react";
import { ArrowRight, Camera, Flame, MapPin, Siren, Users, Waves } from "lucide-react";
import type { SearchResultItem } from "../models/globalSearch.types";
import SearchResultBadge from "./SearchResultBadge";

function formatRelativeTime(value?: string) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function formatCoordinates([lng, lat]: [number, number]) {
  return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? "E" : "W"}`;
}

function EmergencyThumbnail({ item }: { item: SearchResultItem }) {
  const [failed, setFailed] = useState(false);
  const photos = item.details?.photoUrls ?? [];
  const source = photos[0];

  return (
    <div className="relative h-24 overflow-hidden rounded-[10px] bg-slate-100 sm:h-26 xl:h-24 xl:w-40 xl:shrink-0 dark:bg-[#17243A]">
      {source && !failed ? (
        <img src={source} alt="Emergency report evidence" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center bg-slate-100 text-slate-400 dark:bg-[#17243A] dark:text-slate-500">
          <Siren size={32} />
        </div>
      )}
      {photos.length > 0 ? (
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-slate-950/70 px-2 py-1 text-[11px] font-bold text-white">
          <Camera size={12} /> {photos.length}
        </span>
      ) : null}
    </div>
  );
}

function MiniMap({ coordinates }: { coordinates: [number, number] }) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  const src = useMemo(() => {
    if (!token) return null;
    const [lng, lat] = coordinates;
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+e11d48(${lng},${lat})/${lng},${lat},14,0/360x140@2x?access_token=${token}&logo=false&attribution=false`;
  }, [coordinates, token]);

  if (!src) return null;
  return <img src={src} alt="Incident location map preview" loading="lazy" className="h-16 w-full rounded-lg border border-slate-200 object-cover dark:border-[#29405F]" />;
}

function EmergencyTypeIcon({ type }: { type?: string }) {
  const normalized = String(type ?? "").toUpperCase();
  if (normalized === "FIRE") return <Flame size={16} />;
  if (normalized === "FLOOD") return <Waves size={16} />;
  return <Siren size={16} />;
}

export default function EmergencySearchResultCard({
  item,
  onOpen,
}: {
  item: SearchResultItem;
  onOpen: () => void;
}) {
  const details = item.details;
  const relativeTime = formatRelativeTime(details?.reportedAt);

  return (
    <article
      onClick={onOpen}
      className="group cursor-pointer rounded-xl border border-slate-200/90 bg-white p-3 transition hover:border-red-200 hover:shadow-[0_1px_3px_rgba(15,23,42,0.04)] dark:border-[#213451] dark:bg-[#0E1626] dark:hover:border-red-500/30"
    >
      <div className="grid gap-3.5 xl:grid-cols-[160px_minmax(230px,1fr)_190px_176px] xl:items-center">
        <EmergencyThumbnail item={item} />

        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold uppercase leading-4 tracking-wide text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">Emergency</span>
            {item.badge ? <SearchResultBadge {...item.badge} /> : null}
          </div>
          <h3 className="truncate text-[16px] font-semibold text-slate-950 transition group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">
            {item.title}
          </h3>
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <MapPin size={14} className="shrink-0 text-red-600 dark:text-red-400" />
            <span className="truncate">{details?.location || item.subtitle}</span>
          </p>
          {details?.reportedBy || relativeTime ? (
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {details?.reportedBy ? <>Reported by: <span className="font-semibold text-slate-700 dark:text-slate-300">{details.reportedBy}</span></> : null}
              {details?.reportedBy && relativeTime ? " • " : null}
              {relativeTime}
            </p>
          ) : null}
        </div>

        {item.coordinates ? (
          <div className="space-y-1.5 border-t border-slate-100 pt-3 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0 dark:border-[#213451]">
            <div className="truncate rounded-md bg-slate-50 px-2 py-1 text-center font-mono text-[10px] text-slate-500 dark:bg-[#17243A] dark:text-slate-400">
              {formatCoordinates(item.coordinates)}
            </div>
            <MiniMap coordinates={item.coordinates} />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0 dark:border-[#213451]">
          <div className="grid grid-cols-2 gap-2 text-sm xl:grid-cols-1">
            {details?.emergencyType ? (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><EmergencyTypeIcon type={details.emergencyType} /><span className="capitalize">{details.emergencyType.toLowerCase()}</span></div>
            ) : null}
            {details?.severity ? (
              <div className={details.severity === "High" ? "flex items-center gap-2 font-semibold text-red-600 dark:text-red-400" : "flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400"}>
                <Siren size={16} /> {details.severity}
              </div>
            ) : null}
            {details?.assignedResponders !== undefined ? (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><Users size={16} className="text-blue-600 dark:text-blue-400" />{details.assignedResponders} assigned</div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onOpen(); }}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[9px] bg-red-600 px-4 text-[13px] font-semibold text-white transition hover:bg-red-700"
          >
            View on Map <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
