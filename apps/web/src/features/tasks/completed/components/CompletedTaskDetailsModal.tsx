import Modal from "../../../../components/ui/Modal";
import type { DispatchTask } from "../../models/tasks.types";
import { formatCoordinates, formatTaskDateTime, formatVolunteerRole } from "../utils/completedTask.utils";
import EmergencyTypeBadge from "./EmergencyTypeBadge";
import VerifiedBadge from "./VerifiedBadge";

type Props = { task: DispatchTask | null; onClose: () => void };

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[150px_1fr] sm:gap-4">
      <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="break-words text-sm text-slate-800 dark:text-slate-200">{value || "—"}</dd>
    </div>
  );
}

export default function CompletedTaskDetailsModal({ task, onClose }: Props) {
  const completed = formatTaskDateTime(task?.completedAt);
  const verified = formatTaskDateTime(task?.verifiedAt);
  const coordinates = formatCoordinates(task?.emergency?.lat, task?.emergency?.lng);
  return (
    <Modal
      open={Boolean(task)}
      title="Completed Task Details"
      subtitle={task ? `Dispatch ${task.id}` : undefined}
      onClose={onClose}
      maxWidthClassName="max-w-3xl"
      footer={
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-[#293852] dark:text-slate-200 dark:hover:bg-[#152037]">
            Close
          </button>
        </div>
      }
    >
      {task ? (
        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          <div className="flex flex-wrap items-center gap-2">
            <EmergencyTypeBadge type={task.emergency?.emergencyType} />
            <VerifiedBadge />
          </div>
          <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 p-4 dark:divide-[#1C2940] dark:border-[#1C2940]">
            <Detail label="Task ID" value={task.id} />
            <Detail label="Emergency ID" value={task.emergency?.id} />
            <Detail label="Volunteer" value={task.volunteer?.name} />
            <Detail label="Volunteer role" value={formatVolunteerRole(task.volunteer?.role)} />
            <Detail label="Barangay" value={task.emergency?.barangayName} />
            <Detail label="Coordinates" value={coordinates} />
            <Detail label="Completed" value={task.completedAt ? `${completed.date}, ${completed.time}` : null} />
            <Detail label="Verified" value={task.verifiedAt ? `${verified.date}, ${verified.time}` : null} />
          </dl>

          {task.emergency?.notes ? (
            <section className="rounded-2xl border border-slate-200 p-4 dark:border-[#1C2940]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Emergency Notes</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{task.emergency.notes}</p>
            </section>
          ) : null}

          {task.chainRecord ? (
            <section className="rounded-2xl border border-slate-200 p-4 dark:border-[#1C2940]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Blockchain Audit Record</h3>
              <dl className="mt-2 divide-y divide-slate-100 dark:divide-[#1C2940]">
                <Detail label="Network" value={task.chainRecord.network} />
                <Detail label="Contract" value={task.chainRecord.contractAddress} />
                <Detail label="Transaction hash" value={task.chainRecord.txHash} />
                <Detail label="Record hash" value={task.chainRecord.recordHash} />
              </dl>
            </section>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
