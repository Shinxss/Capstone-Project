import { useLguTasksForReview } from "../hooks/useLguTasksForReview";

type Props = ReturnType<typeof useLguTasksForReview> & {
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

export default function LguTasksForReviewView(props: Props) {
  const {
    loading,
    error,
    onRefresh,
    rows,
    verifyError,
    verifyingId,
    onVerify,
    openProof,
    proofOpen,
    proofLoading,
    proofError,
    proofObjectUrl,
    closeProof,
    downloadProof,
  } = props;

  if (loading) return <LoadingPanel />;
  if (error) return <ErrorPanel error={error} onRetry={onRefresh} />;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">For Review</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">Volunteer marked as done + uploaded proof</div>
        </div>
        <button
          onClick={onRefresh}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
        >
          Refresh
        </button>
      </div>

      {verifyError ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{verifyError}</div>
      ) : null}

      {rows.length === 0 ? (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">No tasks for review.</div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-[#162544] dark:bg-[#0B1220]">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-[#0E1626] dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Emergency</th>
                <th className="px-4 py-3">Responder</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Proof</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
              {rows.map((task) => (
                <tr key={task.id}>
                  <td className="px-4 py-3">
                    <div className="font-extrabold text-gray-900 dark:text-slate-100">{String(task.emergency.emergencyType).toUpperCase()}</div>
                    <div className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">{task.emergency.barangayName ? `Barangay: ${task.emergency.barangayName}` : "Barangay: -"}</div>
                    {task.emergency.notes ? <div className="mt-1 text-xs text-gray-700 dark:text-slate-300">{task.emergency.notes}</div> : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 dark:text-slate-100">{task.volunteer?.name ?? "Volunteer"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{task.completedAt ? new Date(task.completedAt).toLocaleString() : "-"}</td>
                  <td className="px-4 py-3">
                    {task.proofs && task.proofs.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {task.proofs.slice(0, 3).map((proof, index) => (
                          <button
                            key={`${proof.url}-${index}`}
                            type="button"
                            onClick={() => void openProof(proof.url, proof.fileName || `proof-${index + 1}.jpg`)}
                            className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-100 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
                          >
                            Proof {index + 1}
                          </button>
                        ))}
                        {task.proofs.length > 3 ? <span className="text-xs text-gray-500 dark:text-slate-500">+{task.proofs.length - 3} more</span> : null}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-slate-500">No proof uploaded</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => void onVerify(task.id)}
                      disabled={verifyingId === task.id}
                      className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {verifyingId === task.id ? "Verifying..." : "Verify"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {proofOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeProof}>
          <div className="w-full max-w-4xl rounded-xl bg-white p-4 shadow-xl dark:bg-[#0B1220] dark:border dark:border-[#162544]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">Proof Preview</div>
              <button
                onClick={closeProof}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
              >
                Close
              </button>
            </div>

            <div className="mt-3">
              {proofLoading ? <div className="text-sm text-gray-600 dark:text-slate-400">Loading proof...</div> : null}
              {proofError ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{proofError}</div> : null}

              {!proofLoading && !proofError && proofObjectUrl ? (
                <>
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626]">
                    <img src={proofObjectUrl} alt="Proof" className="max-h-[75vh] w-full object-contain" />
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      onClick={downloadProof}
                      className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
                    >
                      Download
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

