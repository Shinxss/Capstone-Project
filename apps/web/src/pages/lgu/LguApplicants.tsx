import { Search, Users } from "lucide-react";
import LguShell from "../../components/lgu/LguShell";
import { useLguApplicants } from "../../features/volunteer/hooks/useLguApplicants";
import ApplicantDetailsModal from "../../features/volunteer/components/ApplicantDetailsModal";
import type { VolunteerApplicationStatus } from "../../features/volunteer/models/volunteerApplication.types";

function StatusPill({ status }: { status: VolunteerApplicationStatus }) {
  const map: Record<VolunteerApplicationStatus, string> = {
    pending_verification: "bg-yellow-100 text-yellow-800",
    needs_info: "bg-amber-100 text-amber-800",
    verified: "bg-green-100 text-green-800",
    rejected: "bg-gray-200 text-gray-700",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${map[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function LguApplicants() {
  const {
    items,
    total,
    loading,
    listError,
    query,
    setQuery,
    filter,
    setFilter,
    counts,

    open,
    selected,
    detailsLoading,
    detailsError,
    openDetails,
    closeDetails,

    notes,
    setNotes,
    reviewLoading,
    reviewError,
    review,
  } = useLguApplicants();

  return (
    <LguShell title="Volunteers" subtitle="Applicants (Pending LGU Verification)">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Users className="text-blue-700" size={18} />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{total}</div>
            <div className="text-sm text-gray-600">Total Applicants</div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-2xl font-black text-gray-900">{counts.pending}</div>
          <div className="text-sm text-gray-600">Pending Verification</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-2xl font-black text-gray-900">{counts.needsInfo}</div>
          <div className="text-sm text-gray-600">Needs Info</div>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 w-full md:max-w-md">
            <Search size={18} className="text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, barangay, mobile…"
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-xl px-4 py-2 text-sm font-bold border ${
                filter === "all" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("pending_verification")}
              className={`rounded-xl px-4 py-2 text-sm font-bold border ${
                filter === "pending_verification"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter("needs_info")}
              className={`rounded-xl px-4 py-2 text-sm font-bold border ${
                filter === "needs_info"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              Needs Info
            </button>
          </div>
        </div>

        {listError && <div className="mt-3 text-sm text-red-600">{listError}</div>}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <div className="text-lg font-black text-gray-900">Applicants</div>
            <div className="text-sm text-gray-600">Review and verify volunteer applications</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-5 py-3 font-bold">Applicant</th>
                <th className="text-left px-5 py-3 font-bold">Barangay</th>
                <th className="text-left px-5 py-3 font-bold">Mobile</th>
                <th className="text-left px-5 py-3 font-bold">Status</th>
                <th className="text-right px-5 py-3 font-bold">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="px-5 py-6 text-gray-600" colSpan={5}>
                    Loading applicants…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-gray-600" colSpan={5}>
                    No applicants found.
                  </td>
                </tr>
              ) : (
                items.map((a) => (
                  <tr key={a._id} className="border-t">
                    <td className="px-5 py-3">
                      <div className="font-bold text-gray-900">{a.fullName}</div>
                      <div className="text-xs text-gray-500">{a.email || "—"}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-800">{a.barangay}</td>
                    <td className="px-5 py-3 text-gray-800">{a.mobile}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={a.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => openDetails(a._id)}
                        className="rounded-xl bg-[#DC2626] px-4 py-2 text-xs font-black text-white hover:bg-[#c81e1e]"
                      >
                        View / Verify
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <ApplicantDetailsModal
        open={open}
        loading={detailsLoading}
        error={detailsError}
        app={selected}
        notes={notes}
        setNotes={setNotes}
        reviewLoading={reviewLoading}
        reviewError={reviewError}
        onClose={closeDetails}
        onReview={review}
      />
    </LguShell>
  );
}
