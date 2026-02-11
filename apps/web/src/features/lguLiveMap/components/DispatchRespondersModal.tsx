import { X } from "lucide-react";

import type { LguEmergencyDetails, Volunteer } from "../models/lguLiveMap.types";

type Props = {
  open: boolean;
  emergency: LguEmergencyDetails | null;
  volunteers: Volunteer[];
  selectedIds: string[];
  onToggle: (volunteerId: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

const statusStyles: Record<Volunteer["status"], { dot: string; pill: string; label: string }> = {
  available: { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Available" },
  busy: { dot: "bg-orange-500", pill: "bg-orange-50 text-orange-700 border-orange-200", label: "Busy" },
  offline: { dot: "bg-red-500", pill: "bg-red-50 text-red-700 border-red-200", label: "Offline" },
};

export default function DispatchRespondersModal({
  open,
  emergency,
  volunteers,
  selectedIds,
  onToggle,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  const titleBits = [
    emergency?.emergencyType ? String(emergency.emergencyType) : null,
    emergency?.barangayName ? `Brgy. ${emergency.barangayName}` : null,
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-lg border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-sm font-extrabold text-gray-900">Dispatch Responders</div>
            <div className="mt-0.5 text-xs text-gray-600">
              {titleBits.length ? titleBits.join(" • ") : "Select responders for this emergency"}
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-lg hover:bg-gray-100 grid place-items-center text-gray-700"
            aria-label="Close"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <div className="text-xs font-bold text-gray-700 mb-2">Available responders</div>

          <div className="max-h-[340px] overflow-y-auto rounded-xl border border-gray-200">
            {volunteers.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-600">No responders found.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {volunteers.map((v) => {
                  const selected = selectedIds.includes(v.id);
                  const isSelectable = v.status === "available";
                  const s = statusStyles[v.status];

                  return (
                    <li
                      key={v.id}
                      className={[
                        "px-4 py-3 flex items-center justify-between",
                        isSelectable ? "hover:bg-gray-50" : "opacity-70",
                      ].join(" ")}
                    >
                      <button
                        type="button"
                        className="flex-1 text-left flex items-center gap-3"
                        onClick={() => onToggle(v.id)}
                        disabled={!isSelectable}
                        aria-label={`Toggle ${v.name}`}
                      >
                        <span
                          className={[
                            "h-2.5 w-2.5 rounded-full",
                            s.dot,
                          ].join(" ")}
                        />

                        <div>
                          <div className="text-sm font-bold text-gray-900">{v.name}</div>
                          <div className="text-xs text-gray-600">{v.skill}</div>
                        </div>
                      </button>

                      <div className="flex items-center gap-3">
                        <span
                          className={[
                            "text-[11px] font-extrabold px-2 py-0.5 rounded-full border",
                            s.pill,
                          ].join(" ")}
                        >
                          {s.label}
                        </span>

                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => onToggle(v.id)}
                          disabled={!isSelectable}
                          className="h-4 w-4 accent-blue-600"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 rounded-lg border border-gray-300 py-2 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="w-1/2 rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
              disabled={selectedIds.length === 0}
            >
              Dispatch
            </button>
          </div>

          <div className="mt-3 text-[11px] text-gray-500">
            Note: This is a demo dispatch flow. Dispatched responders are marked as <span className="font-semibold">Busy</span>.
          </div>
        </div>
      </div>
    </div>
  );
}
