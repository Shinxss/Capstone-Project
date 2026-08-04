import { Activity, Building2, Droplets, Flame, MapPin, Mountain, Siren, Stethoscope, Wind, X } from "lucide-react";
import type { EmergencyType } from "../../../emergency/constants/emergency.constants";
import type { DispatchEmergencyContext, PresenceConnectionState } from "../types/dispatchResponders.types";

function EmergencyIcon({ type }: { type: EmergencyType }) {
  const className = "h-5 w-5";
  if (type === "FIRE") return <Flame className={className} />;
  if (type === "FLOOD") return <Droplets className={className} />;
  if (type === "TYPHOON") return <Wind className={className} />;
  if (type === "EARTHQUAKE") return <Mountain className={className} />;
  if (type === "COLLAPSE") return <Building2 className={className} />;
  if (type === "MEDICAL") return <Stethoscope className={className} />;
  if (type === "SOS") return <Siren className={className} />;
  return <Activity className={className} />;
}

export default function DispatchDrawerHeader({
  emergency,
  connectionState,
  onClose,
  closeButtonRef,
}: {
  emergency: DispatchEmergencyContext;
  connectionState: PresenceConnectionState;
  onClose: () => void;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const connectionText = connectionState === "live" ? "Availability updates are live" : connectionState === "connecting" ? "Connecting to live availability" : "Reconnecting to live availability";
  return (
    <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 dark:border-[#1D2B43] dark:bg-[#0B1220] sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"><EmergencyIcon type={emergency.emergencyType} /></div>
          <div className="min-w-0">
            <h2 id="dispatch-responders-title" className="text-lg font-bold text-slate-950 dark:text-white">Dispatch Responders</h2>
            <p className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">{emergency.title}</p>
          </div>
        </div>
        <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close dispatch responders" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-[#152139] dark:hover:text-white"><X size={20} /></button>
      </div>
      <div className="mt-3 grid gap-1.5 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="min-w-0 space-y-1.5">
          <p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0" /><span className="truncate">{emergency.location}</span></p>
          <p className="font-mono">ID: {emergency.referenceNumber}</p>
        </div>
        <p className="flex items-center gap-1.5 text-[11px]" role="status">
          <span className={`h-2 w-2 rounded-full ${connectionState === "live" ? "bg-emerald-500" : "animate-pulse bg-amber-500"}`} />
          {connectionText}
        </p>
      </div>
    </header>
  );
}
