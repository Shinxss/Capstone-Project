import { Search, ShieldCheck } from "lucide-react";
import LguShell from "../../components/lgu/LguShell";
import { useLguVerifiedVolunteers } from "../../features/volunteer/hooks/useLguVerifiedVolunteers";
import VerifiedVolunteerDetailsModal from "../../features/volunteer/components/VerifiedVolunteerDetailsModal";

export default function LguVerifiedVolunteers() {
  const {
    items,
    total,
    loading,
    listError,
    query,
    setQuery,

    open,
    selected,
    detailsLoading,
    detailsError,
    openDetails,
    closeDetails,
  } = useLguVerifiedVolunteers();

  return (
    <LguShell title="Volunteers" subtitle="Verified Volunteers">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
            <ShieldCheck className="text-green-700" size={18} />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{total}</div>
            <div className="text-sm text-gray-600">Verified Volunteers</div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-2xl font-black text-gray-900">—</div>
          <div className="text-sm text-gray-600">Active (optional)</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-2xl font-black text-gray-900">—</div>
          <div className="text-sm text-gray-600">On Duty (optional)</div>
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
        </div>

        {listError && <div className="mt-3 text-sm text-red-600">{listError}</div>}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b">
          <div className="text-lg font-black text-gray-900">Verified Volunteers</div>
          <div className="text-sm text-gray-600">List of volunteers approved by LGU</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-5 py-3 font-bold">Volunteer</th>
                <th className="text-left px-5 py-3 font-bold">Barangay</th>
                <th className="text-left px-5 py-3 font-bold">Mobile</th>
                <th className="text-left px-5 py-3 font-bold">Skills</th>
                <th className="text-left px-5 py-3 font-bold">Verified At</th>
                <th className="text-right px-5 py-3 font-bold">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="px-5 py-6 text-gray-600" colSpan={6}>
                    Loading verified volunteers…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-gray-600" colSpan={6}>
                    No verified volunteers found.
                  </td>
                </tr>
              ) : (
                items.map((v) => (
                  <tr key={v._id} className="border-t">
                    <td className="px-5 py-3">
                      <div className="font-bold text-gray-900">{v.fullName}</div>
                      <div className="text-xs text-gray-500">{v.email || "—"}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-800">{v.barangay}</td>
                    <td className="px-5 py-3 text-gray-800">{v.mobile}</td>
                    <td className="px-5 py-3 text-gray-800">{v.skillsOther || "—"}</td>
                    <td className="px-5 py-3 text-gray-800">{v.reviewedAt || "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => openDetails(v._id)}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-50"
                      >
                        View
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
      <VerifiedVolunteerDetailsModal
        open={open}
        loading={detailsLoading}
        error={detailsError}
        data={selected}
        onClose={closeDetails}
      />
    </LguShell>
  );
}
