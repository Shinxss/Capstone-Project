import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, MapPin } from "lucide-react";
import type { EmergencyApprovalItem } from "../models/approvals.types";
import { approvalLocation, formatApprovalCoordinates } from "../utils/approval.utils";

export default function ReportLocationCard({
  item,
  onOpenMap,
}: {
  item: EmergencyApprovalItem;
  onOpenMap: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  const mapUrl = useMemo(() => {
    if (!token || !item.coordinates) return null;
    const [longitude, latitude] = item.coordinates;
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+e11d48(${longitude},${latitude})/${longitude},${latitude},13.5,0/640x230@2x?access_token=${token}&logo=false&attribution=false`;
  }, [item.coordinates, token]);
  const coordinateLabel = formatApprovalCoordinates(item.coordinates);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-base font-bold text-slate-950"><MapPin size={19} /> Location</h2>
        <button type="button" onClick={onOpenMap} className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700">
          <ExternalLink size={14} /> Open in Map
        </button>
      </div>
      <button type="button" onClick={onOpenMap} className="relative mt-4 block h-40 w-full overflow-hidden rounded-lg bg-slate-100 text-left">
        {mapUrl ? <img src={mapUrl} alt="Reported emergency location map" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-slate-400"><MapPin size={34} /></span>}
        <span className="absolute left-1/2 top-1/2 max-w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-md">
          {approvalLocation(item)}
        </span>
      </button>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs font-medium text-slate-600">
        <span>{coordinateLabel}</span>
        {item.coordinates ? (
          <button
            type="button"
            aria-label="Copy coordinates"
            title="Copy coordinates"
            onClick={async () => {
              await navigator.clipboard.writeText(coordinateLabel);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            }}
            className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          </button>
        ) : null}
      </div>
    </section>
  );
}
