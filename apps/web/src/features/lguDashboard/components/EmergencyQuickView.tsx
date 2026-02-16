import { MapPin, X } from "lucide-react";
import { EMERGENCY_TYPE_LABEL } from "../../emergency/constants/emergency.constants";
import type { DashboardEmergencyItem } from "../models/lguDashboard.types";

export default function EmergencyQuickView({
  item,
  onClose,
  onOpenInMap,
  variant = "floating",
}: {
  item: DashboardEmergencyItem;
  onClose: () => void;
  onOpenInMap: (id: string) => void;
  variant?: "floating" | "map";
}) {
  const typeLabel = EMERGENCY_TYPE_LABEL[item.type] ?? String(item.type);

  return (
    <div
      className={
        variant === "floating"
          ? "fixed bottom-6 right-6 z-220 w-105 max-w-[calc(100vw-2rem)]"
          : "w-65 max-w-[calc(100vw-2rem)]"
      }
    >
      <div className="rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden dark:bg-[#0B1220] dark:border-[#162544]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#162544]">
          <div className="min-w-0">
            <div className="text-xs font-bold text-gray-900 truncate dark:text-slate-100">{typeLabel}</div>
            <div className="text-xs text-gray-500 truncate dark:text-slate-500">Emergency details</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-xl hover:bg-gray-100 grid place-items-center text-gray-700 dark:text-slate-300 dark:hover:bg-[#122036]"
            aria-label="Close"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-2">
          <div>
            <div className="text-[11px] text-gray-500 dark:text-slate-500">Reporter</div>
            <div className="text-sm font-bold text-gray-900 dark:text-slate-100">{item.reporterName ?? "-"}</div>
          </div>

          <div className="mt-2">
            <div className="text-xs text-gray-900 dark:text-slate-300">
              {item.barangayName ? `Barangay ${item.barangayName}` : "-"}
              {item.barangayCity ? `, ${item.barangayCity}` : ""}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onOpenInMap(item.id)}
              className="w-full rounded-xl bg-black text-white hover:bg-black/90 px-4 py-3 text-sm font-extrabold flex items-center justify-center gap-2"
            >
              <MapPin size={16} />
              Open in Live Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
