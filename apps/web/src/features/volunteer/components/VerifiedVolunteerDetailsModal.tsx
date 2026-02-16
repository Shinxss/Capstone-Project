import type { VolunteerApplication } from "../models/volunteerApplication.types";

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-3 py-1">
      <div className="text-xs font-semibold text-gray-500 dark:text-slate-500">{label}</div>
      <div className="text-sm text-gray-900 wrap-break-word dark:text-slate-100">{value || "-"}</div>
    </div>
  );
}

export default function VerifiedVolunteerDetailsModal(props: {
  open: boolean;
  loading: boolean;
  error: string | null;
  data: VolunteerApplication | null;
  onClose: () => void;
}) {
  const { open, loading, error, data, onClose } = props;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-lg overflow-hidden dark:bg-[#0B1220] dark:border dark:border-[#162544]">
        <div className="p-5 border-b flex items-center justify-between dark:border-[#162544]">
          <div>
            <div className="text-lg font-black text-gray-900 dark:text-slate-100">Verified Volunteer</div>
            <div className="text-sm text-gray-600 dark:text-slate-400">Volunteer profile (from verified application)</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold hover:bg-gray-50 dark:border-[#162544] dark:text-slate-300 dark:hover:bg-[#122036]"
          >
            Close
          </button>
        </div>

        <div className="p-5">
          {loading && <div className="text-sm text-gray-600 dark:text-slate-400">Loading...</div>}
          {!!error && <div className="text-sm text-red-600">{error}</div>}

          {!loading && !error && data && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-xl border border-gray-200 p-4 dark:border-[#162544]">
                <div className="text-sm font-black text-gray-900 mb-2 dark:text-slate-100">Personal</div>
                <Row label="Full Name" value={data.fullName} />
                <Row label="Sex" value={String(data.sex || "")} />
                <Row label="Birthdate" value={data.birthdate} />
                <Row label="Status" value={data.status} />
                <Row label="Verified At" value={data.reviewedAt} />
              </div>

              <div className="rounded-xl border border-gray-200 p-4 dark:border-[#162544]">
                <div className="text-sm font-black text-gray-900 mb-2 dark:text-slate-100">Contact</div>
                <Row label="Mobile" value={data.mobile} />
                <Row label="Email" value={data.email} />
                <Row label="Barangay" value={data.barangay} />
                <Row label="City" value={data.city} />
                <Row label="Province" value={data.province} />
                <Row label="Street" value={data.street} />
              </div>

              <div className="rounded-xl border border-gray-200 p-4 dark:border-[#162544]">
                <div className="text-sm font-black text-gray-900 mb-2 dark:text-slate-100">Emergency Contact</div>
                <Row label="Name" value={data.emergencyContact?.name} />
                <Row label="Relationship" value={data.emergencyContact?.relationship} />
                <Row label="Mobile" value={data.emergencyContact?.mobile} />
                <Row
                  label="Address"
                  value={
                    data.emergencyContact?.addressSameAsApplicant
                      ? "Same as applicant"
                      : data.emergencyContact?.address
                  }
                />
              </div>

              <div className="rounded-xl border border-gray-200 p-4 dark:border-[#162544]">
                <div className="text-sm font-black text-gray-900 mb-2 dark:text-slate-100">Skills / Notes</div>
                <Row label="Skills" value={data.skillsOther} />
                <Row label="Certifications" value={data.certificationsText} />
                <Row label="Availability" value={data.availabilityText} />
                <Row label="Preferred Role" value={data.preferredAssignmentText} />
                <Row label="Health Notes" value={data.healthNotes} />
              </div>

              {!!data.reviewNotes && (
                <div className="rounded-xl border border-gray-200 p-4 lg:col-span-2 dark:border-[#162544]">
                  <div className="text-sm font-black text-gray-900 mb-2 dark:text-slate-100">LGU Notes</div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap dark:text-slate-200">{data.reviewNotes}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
