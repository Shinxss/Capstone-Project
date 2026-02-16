import { Search, ShieldCheck } from "lucide-react";
import VerifiedVolunteerDetailsModal from "./VerifiedVolunteerDetailsModal";
import { useLguVerifiedVolunteers } from "../hooks/useLguVerifiedVolunteers";

type Props = ReturnType<typeof useLguVerifiedVolunteers> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function LoadingPanel() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
      Loading...
    </div>
  );
}

function ErrorPanel({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:border-red-500/25 dark:text-red-200">
      <div className="flex items-center justify-between gap-3">
        <span>{error}</span>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function LguVerifiedVolunteersView(props: Props) {
  const {
    loading,
    error,
    onRefresh,
    items,
    total,
    query,
    setQuery,
    open,
    selected,
    detailsLoading,
    detailsError,
    openDetails,
    closeDetails,
  } = props;

  if (loading) return <LoadingPanel />;
  if (error) return <ErrorPanel error={error} onRetry={onRefresh} />;

  return (
    <>
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-[#162544] dark:bg-[#0B1220]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-green-100 bg-green-50 dark:border-green-500/25 dark:bg-green-500/10">
            <ShieldCheck className="text-green-700" size={18} />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-slate-100">{total}</div>
            <div className="text-sm text-gray-600 dark:text-slate-400">Verified Volunteers</div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[#162544] dark:bg-[#0B1220]">
          <div className="text-2xl font-black text-gray-900 dark:text-slate-100">-</div>
          <div className="text-sm text-gray-600 dark:text-slate-400">Active (optional)</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[#162544] dark:bg-[#0B1220]">
          <div className="text-2xl font-black text-gray-900 dark:text-slate-100">-</div>
          <div className="text-sm text-gray-600 dark:text-slate-400">On Duty (optional)</div>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 md:max-w-md dark:border-[#162544] dark:bg-[#0E1626]">
            <Search size={18} className="text-gray-500 dark:text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, barangay, mobile..."
              className="w-full bg-transparent text-sm outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <button
            onClick={onRefresh}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300 dark:hover:bg-[#122036]"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-[#162544] dark:bg-[#0B1220]">
        <div className="border-b px-5 py-4 dark:border-[#162544]">
          <div className="text-lg font-black text-gray-900 dark:text-slate-100">Verified Volunteers</div>
          <div className="text-sm text-gray-600 dark:text-slate-400">List of volunteers approved by LGU</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-[#0E1626] dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 text-left font-bold">Volunteer</th>
                <th className="px-5 py-3 text-left font-bold">Barangay</th>
                <th className="px-5 py-3 text-left font-bold">Mobile</th>
                <th className="px-5 py-3 text-left font-bold">Skills</th>
                <th className="px-5 py-3 text-left font-bold">Verified At</th>
                <th className="px-5 py-3 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-gray-600 dark:text-slate-400" colSpan={6}>
                    No verified volunteers found.
                  </td>
                </tr>
              ) : (
                items.map((volunteer) => (
                  <tr key={volunteer._id} className="border-t dark:border-[#162544]">
                    <td className="px-5 py-3">
                      <div className="font-bold text-gray-900 dark:text-slate-100">{volunteer.fullName}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-500">{volunteer.email || "-"}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-800 dark:text-slate-300">{volunteer.barangay}</td>
                    <td className="px-5 py-3 text-gray-800 dark:text-slate-300">{volunteer.mobile}</td>
                    <td className="px-5 py-3 text-gray-800 dark:text-slate-300">{volunteer.skillsOther || "-"}</td>
                    <td className="px-5 py-3 text-gray-800 dark:text-slate-300">{volunteer.reviewedAt || "-"}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => void openDetails(volunteer._id)}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-50 dark:border-[#162544] dark:text-slate-300 dark:hover:bg-[#122036]"
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

      <VerifiedVolunteerDetailsModal
        open={open}
        loading={detailsLoading}
        error={detailsError}
        data={selected}
        onClose={closeDetails}
      />
    </>
  );
}

