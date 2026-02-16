import type { VolunteerApplication } from "../models/volunteerApplication.types";

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-1">
      <div className="text-xs font-semibold text-gray-500 dark:text-slate-500">{label}</div>
      <div className="text-sm text-gray-900 wrap-break-word dark:text-slate-100">{value || "-"}</div>
    </div>
  );
}

export default function ApplicantDetailsModal(props: {
  open: boolean;
  loading: boolean;
  error: string | null;
  app: VolunteerApplication | null;

  notes: string;
  setNotes: (v: string) => void;

  reviewLoading: boolean;
  reviewError: string | null;

  onClose: () => void;
  onReview: (action: "verified" | "needs_info" | "rejected") => void;
}) {
  const { open, loading, error, app, notes, setNotes, reviewLoading, reviewError, onClose, onReview } = props;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-lg overflow-hidden dark:bg-[#0B1220] dark:border dark:border-[#162544]">
        <div className="p-5 border-b flex items-center justify-between dark:border-[#162544]">
          <div>
            <div className="text-lg font-black text-gray-900 dark:text-slate-100">Applicant Details</div>
            <div className="text-sm text-gray-600 dark:text-slate-400">View and verify volunteer application</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold hover:bg-gray-50 dark:border-[#162544] dark:text-slate-300 dark:hover:bg-[#122036]"
            disabled={reviewLoading}
          >
            Close
          </button>
        </div>

        <div className="p-5">
          {loading && <div className="text-sm text-gray-600 dark:text-slate-400">Loading application...</div>}
          {!!error && <div className="text-sm text-red-600">{error}</div>}

          {!loading && !error && app && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-xl border border-gray-200 p-4 dark:border-[#162544]">
                <div className="text-sm font-black text-gray-900 mb-2 dark:text-slate-100">Personal</div>
                <Row label="Full Name" value={app.fullName} />
                <Row label="Sex" value={app.sex} />
                <Row label="Birthdate" value={app.birthdate} />
                <Row label="Status" value={app.status} />
              </div>

              <div className="rounded-xl border border-gray-200 p-4 dark:border-[#162544]">
                <div className="text-sm font-black text-gray-900 mb-2 dark:text-slate-100">Contact</div>
                <Row label="Mobile" value={app.mobile} />
                <Row label="Email" value={app.email} />
                <Row label="Barangay" value={app.barangay} />
                <Row label="City" value={app.city} />
                <Row label="Province" value={app.province} />
                <Row label="Street" value={app.street} />
              </div>

              <div className="rounded-xl border border-gray-200 p-4 dark:border-[#162544]">
                <div className="text-sm font-black text-gray-900 mb-2 dark:text-slate-100">Emergency Contact</div>
                <Row label="Name" value={app.emergencyContact?.name} />
                <Row label="Relationship" value={app.emergencyContact?.relationship} />
                <Row label="Mobile" value={app.emergencyContact?.mobile} />
                <Row
                  label="Address"
                  value={
                    app.emergencyContact?.addressSameAsApplicant
                      ? "Same as applicant"
                      : app.emergencyContact?.address
                  }
                />
              </div>

              <div className="rounded-xl border border-gray-200 p-4 dark:border-[#162544]">
                <div className="text-sm font-black text-gray-900 mb-2 dark:text-slate-100">Skills / Notes</div>
                <Row label="Skills" value={app.skillsOther} />
                <Row label="Certifications" value={app.certificationsText} />
                <Row label="Availability" value={app.availabilityText} />
                <Row label="Preferred Role" value={app.preferredAssignmentText} />
                <Row label="Health Notes" value={app.healthNotes} />
              </div>

              <div className="rounded-xl border border-gray-200 p-4 lg:col-span-2 dark:border-[#162544]">
                <div className="text-sm font-black text-gray-900 mb-2 dark:text-slate-100">Review Notes (optional)</div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes for this applicant (e.g., bring barangay clearance, orientation schedule, etc.)"
                  className="w-full min-h-22.5 rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#2B4A7A]"
                  disabled={reviewLoading}
                />
                {!!reviewError && <div className="mt-2 text-sm text-red-600">{reviewError}</div>}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t flex flex-wrap gap-2 justify-end dark:border-[#162544]">
          <button
            onClick={() => onReview("rejected")}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-[#162544] dark:text-slate-300 dark:hover:bg-[#122036]"
            disabled={reviewLoading || !app}
          >
            Reject
          </button>

          <button
            onClick={() => onReview("needs_info")}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60"
            disabled={reviewLoading || !app}
          >
            Needs Info
          </button>

          <button
            onClick={() => onReview("verified")}
            className="rounded-xl bg-[#DC2626] px-4 py-2 text-sm font-bold text-white hover:bg-[#c81e1e] disabled:opacity-60"
            disabled={reviewLoading || !app}
          >
            {reviewLoading ? "Verifying..." : "Verify Applicant"}
          </button>
        </div>
      </div>
    </div>
  );
}
