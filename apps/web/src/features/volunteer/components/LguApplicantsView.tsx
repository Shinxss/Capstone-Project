import { Search, Users } from "lucide-react";
import ApplicantDetailsModal from "./ApplicantDetailsModal";
import EmptyState from "../../../components/ui/EmptyState";
import type { VolunteerApplicationStatus } from "../models/volunteerApplication.types";
import { useLguApplicants } from "../hooks/useLguApplicants";

type Props = ReturnType<typeof useLguApplicants> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function StatusPill({ status }: { status: VolunteerApplicationStatus }) {
  const map: Record<VolunteerApplicationStatus, string> = {
    pending_verification: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300",
    needs_info: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
    verified: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
    rejected: "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-slate-300",
  };

  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${map[status]}`}>{status.replace("_", " ")}</span>;
}

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

export default function LguApplicantsView(props: Props) {
  const {
    loading,
    error,
    onRefresh,
    items,
    total,
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
  } = props;

  if (loading) return <LoadingPanel />;
  if (error) return <ErrorPanel error={error} onRetry={onRefresh} />;

  return (
    <>
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-[#162544] dark:bg-[#0B1220]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 dark:border-blue-500/25 dark:bg-blue-500/10">
            <Users className="text-blue-700" size={18} />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-slate-100">{total}</div>
            <div className="text-sm text-gray-600 dark:text-slate-400">Total Applicants</div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[#162544] dark:bg-[#0B1220]">
          <div className="text-2xl font-black text-gray-900 dark:text-slate-100">{counts.pending}</div>
          <div className="text-sm text-gray-600 dark:text-slate-400">Pending Verification</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[#162544] dark:bg-[#0B1220]">
          <div className="text-2xl font-black text-gray-900 dark:text-slate-100">{counts.needsInfo}</div>
          <div className="text-sm text-gray-600 dark:text-slate-400">Needs Info</div>
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

          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-xl border px-4 py-2 text-sm font-bold ${
                filter === "all"
                  ? "border-gray-900 bg-gray-900 text-white dark:border-blue-600 dark:bg-blue-600"
                  : "border-gray-200 bg-white text-gray-700 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("pending_verification")}
              className={`rounded-xl border px-4 py-2 text-sm font-bold ${
                filter === "pending_verification"
                  ? "border-gray-900 bg-gray-900 text-white dark:border-blue-600 dark:bg-blue-600"
                  : "border-gray-200 bg-white text-gray-700 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter("needs_info")}
              className={`rounded-xl border px-4 py-2 text-sm font-bold ${
                filter === "needs_info"
                  ? "border-gray-900 bg-gray-900 text-white dark:border-blue-600 dark:bg-blue-600"
                  : "border-gray-200 bg-white text-gray-700 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300"
              }`}
            >
              Needs Info
            </button>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={onRefresh}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300 dark:hover:bg-[#122036]"
          >
            Refresh
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState className="mt-4" icon={Users} title="No applicants found." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-[#162544] dark:bg-[#0B1220]">
          <div className="flex items-center justify-between border-b px-5 py-4 dark:border-[#162544]">
            <div>
              <div className="text-lg font-black text-gray-900 dark:text-slate-100">Applicants</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Review and verify volunteer applications</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 dark:bg-[#0E1626] dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 text-left font-bold">Applicant</th>
                  <th className="px-5 py-3 text-left font-bold">Barangay</th>
                  <th className="px-5 py-3 text-left font-bold">Mobile</th>
                  <th className="px-5 py-3 text-left font-bold">Status</th>
                  <th className="px-5 py-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((applicant) => (
                  <tr key={applicant._id} className="border-t dark:border-[#162544]">
                    <td className="px-5 py-3">
                      <div className="font-bold text-gray-900 dark:text-slate-100">{applicant.fullName}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-500">{applicant.email || "-"}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-800 dark:text-slate-300">{applicant.barangay}</td>
                    <td className="px-5 py-3 text-gray-800 dark:text-slate-300">{applicant.mobile}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={applicant.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => void openDetails(applicant._id)}
                        className="rounded-xl bg-[#DC2626] px-4 py-2 text-xs font-black text-white hover:bg-[#c81e1e]"
                      >
                        View / Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
    </>
  );
}

