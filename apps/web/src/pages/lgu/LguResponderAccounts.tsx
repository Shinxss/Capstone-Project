import LguShell from "../../components/lgu/LguShell";
import { toastInfo } from "../../services/feedback/toast.service";

export default function LguResponderAccounts() {
  return (
    <LguShell title="Responder Accounts" subtitle="Manage responder personnel records and role assignments">
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => toastInfo("Add Responder action is coming soon.")}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Add Responder
          </button>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-700 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
          Responder Accounts page is under construction.
        </div>
      </div>
    </LguShell>
  );
}
