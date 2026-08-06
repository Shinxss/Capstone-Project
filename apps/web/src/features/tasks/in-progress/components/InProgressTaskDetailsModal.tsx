import { CalendarClock, MapPin, Navigation, Users } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import type { InProgressTaskGroup } from "../types/inProgressTask.types";
import { formatCoordinates, formatTaskDate } from "../utils/inProgressTask.utils";

type Props = { group: InProgressTaskGroup | null; onClose: () => void };

export default function InProgressTaskDetailsModal({ group, onClose }: Props) {
  const emergency = group?.emergency;
  return (
    <Modal open={Boolean(group)} onClose={onClose} title={emergency ? `${emergency.emergencyType.toLocaleUpperCase()} Emergency` : "Emergency details"} subtitle={emergency?.referenceNumber ?? emergency?.id} maxWidthClassName="max-w-2xl">
      {group && emergency ? (
        <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-[#0E1626]"><dt className="flex items-center gap-2 text-xs font-bold text-slate-500"><MapPin size={14} /> Location</dt><dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{emergency.barangayName ?? "Barangay unavailable"}</dd><dd className="text-xs text-slate-500">{formatCoordinates(emergency.lat, emergency.lng) ?? "Coordinates unavailable"}</dd></div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-[#0E1626]"><dt className="flex items-center gap-2 text-xs font-bold text-slate-500"><CalendarClock size={14} /> Reported</dt><dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{formatTaskDate(group.reportedAt)}</dd></div>
          </dl>
          {emergency.notes ? <div><h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Emergency notes</h3><p className="mt-2 rounded-xl border border-slate-200 p-3 text-sm leading-6 text-slate-700 dark:border-[#24324A] dark:text-slate-200">{emergency.notes}</p></div> : null}
          <div>
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500"><Users size={14} /> Assigned responders ({group.offers.length})</h3>
            <div className="mt-2 space-y-2">
              {group.offers.map((offer) => (
                <div key={offer.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-[#24324A]">
                  <div><p className="text-sm font-bold text-slate-900 dark:text-white">{offer.volunteer?.name ?? "Assigned volunteer"}</p><p className="text-xs text-slate-500">{offer.volunteer?.role ?? "Volunteer"} · Task {offer.id}</p></div>
                  <p className="inline-flex items-center gap-1 text-xs text-slate-500"><Navigation size={13} /> {formatCoordinates(offer.lastKnownLocation?.lat, offer.lastKnownLocation?.lng) ?? "Location unavailable"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
