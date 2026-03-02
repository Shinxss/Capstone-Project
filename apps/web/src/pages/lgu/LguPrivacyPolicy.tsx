import LguShell from "../../components/lgu/LguShell";

const effectiveDate = "February 28, 2026";

export default function LguPrivacyPolicy() {
  return (
    <LguShell title="Privacy Policy" subtitle="How your account and operational data are handled">
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-[#162544] dark:bg-[#0B1220]">
          <div className="text-sm font-extrabold text-gray-900 dark:text-slate-100">Privacy Policy</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-slate-500">Effective date: {effectiveDate}</div>
          <p className="mt-3 text-sm text-gray-700 dark:text-slate-300">
            Lifeline processes account information, dispatch records, and system activity to support emergency
            operations, service delivery, and security monitoring.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-[#162544] dark:bg-[#0B1220]">
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-slate-100">Data We Use</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-slate-300">
              <li>Profile and account details</li>
              <li>Dispatch and response activity</li>
              <li>Notification preferences and delivery state</li>
              <li>Security and audit logs for access control</li>
            </ul>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-[#162544] dark:bg-[#0B1220]">
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-slate-100">How We Use Data</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-slate-300">
              <li>Coordinate emergency response workflows</li>
              <li>Deliver notifications to web and email channels</li>
              <li>Maintain audit trails and investigate incidents</li>
              <li>Improve reliability and platform performance</li>
            </ul>
          </section>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-[#162544] dark:bg-[#0B1220]">
          <h2 className="text-sm font-extrabold text-gray-900 dark:text-slate-100">Your Controls</h2>
          <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">
            You can manage notification delivery from Notification Settings. For profile updates, access account
            details from Profile and Password & Security.
          </p>
        </section>
      </div>
    </LguShell>
  );
}
