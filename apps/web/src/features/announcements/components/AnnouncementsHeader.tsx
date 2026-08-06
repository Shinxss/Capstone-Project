import { PlusCircle } from "lucide-react";

type Props = { onCreate: () => void };

export default function AnnouncementsHeader({ onCreate }: Props) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Announcements</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Draft, publish, and manage emergency announcements.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onCreate} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"><PlusCircle size={18} /> New Announcement</button>
      </div>
    </header>
  );
}
