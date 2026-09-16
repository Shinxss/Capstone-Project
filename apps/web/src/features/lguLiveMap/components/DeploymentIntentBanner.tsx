import { UserRoundCheck, X } from "lucide-react";
import type { DeploymentIntentViewModel } from "../utils/deploymentIntent.utils";

type Props = {
  intent: DeploymentIntentViewModel;
  onCancel: () => void;
};

export default function DeploymentIntentBanner({ intent, onCancel }: Props) {
  return (
    <div className="absolute left-1/2 top-16 z-20 w-[min(440px,calc(100%-1.5rem))] -translate-x-1/2 rounded-2xl border border-blue-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-blue-500/30 dark:bg-[#0B1220]/95">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
          <UserRoundCheck size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-black text-gray-900 dark:text-slate-100">Deploy Volunteer</div>
          <div className="mt-1 text-sm font-semibold text-gray-700 dark:text-slate-300">
            {intent.volunteerName} is ready for deployment.
          </div>
          <div className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">
            Select an active emergency on the map to continue.
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-slate-400 dark:hover:bg-[#162544] dark:hover:text-slate-100"
          aria-label="Cancel volunteer deployment"
          title="Cancel"
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
}
