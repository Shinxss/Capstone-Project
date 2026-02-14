import LguShell from "../../components/lgu/LguShell";
import InlineAlert from "../../components/ui/InlineAlert";
import { useLguSettings } from "../../features/settings/hooks/useLguSettings";

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:bg-[#0B1220] dark:border-[#162544]">
      <div className="min-w-0">
        <div className="text-sm font-bold text-gray-900 dark:text-slate-100">{label}</div>
        <div className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">{description}</div>
      </div>
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-blue-600"
        />
      </label>
    </div>
  );
}

export default function LguSettings() {
  const vm = useLguSettings();

  return (
    <LguShell title="Settings" subtitle="Personal and operational preferences">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">Preferences</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">
            Saved locally for now. Connect to API when available.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={vm.refresh}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
          >
            Refresh
          </button>
          <button
            onClick={vm.save}
            disabled={vm.saving}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {vm.saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {vm.error ? (
        <div className="mt-4">
          <InlineAlert variant="error" title="Settings">
            {vm.error}
          </InlineAlert>
        </div>
      ) : null}

      {vm.savedAt ? (
        <div className="mt-3 text-xs text-gray-500 dark:text-slate-500">
          Last saved: {new Date(vm.savedAt).toLocaleString()}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="text-sm font-extrabold text-gray-900 dark:text-slate-100">Notifications</div>

          <ToggleRow
            label="Emergencies"
            description="Notify me when new emergencies are reported."
            checked={vm.settings.notifications.emergencies}
            onChange={(v) => vm.update({ notifications: { emergencies: v } })}
          />
          <ToggleRow
            label="Task Updates"
            description="Notify me about dispatch/task status updates."
            checked={vm.settings.notifications.taskUpdates}
            onChange={(v) => vm.update({ notifications: { taskUpdates: v } })}
          />
          <ToggleRow
            label="Verification Needed"
            description="Notify me when dispatches are completed and need verification."
            checked={vm.settings.notifications.verificationNeeded}
            onChange={(v) => vm.update({ notifications: { verificationNeeded: v } })}
          />
          <ToggleRow
            label="Announcements"
            description="Notify me when new announcements are published."
            checked={vm.settings.notifications.announcements}
            onChange={(v) => vm.update({ notifications: { announcements: v } })}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[#0B1220] dark:border-[#162544]">
            <div className="text-sm font-extrabold text-gray-900 dark:text-slate-100">UI Preferences</div>
            <div className="mt-1 text-xs text-gray-500 dark:text-slate-500">Controls default table page size.</div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">Default page size</label>
              <input
                type="number"
                min={5}
                max={200}
                value={vm.settings.ui.defaultPageSize}
                onChange={(e) => vm.update({ ui: { defaultPageSize: Number(e.target.value || 0) } })}
                className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
              />
              <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-500">Recommended: 25</div>
            </div>

            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={vm.reset}
                className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
              >
                Reset to defaults
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[#0B1220] dark:border-[#162544]">
            <div className="text-sm font-extrabold text-gray-900 dark:text-slate-100">Security</div>
            <div className="mt-1 text-xs text-gray-500 dark:text-slate-500">
              Session/device management is a stub until backend support is added.
            </div>

            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200">
              <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Sessions</div>
              <div className="mt-1">Device list: Not available yet.</div>
            </div>
          </div>
        </div>
      </div>
    </LguShell>
  );
}

