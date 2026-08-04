function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-[#1A2942] ${className}`} />;
}

export default function CompletedTasksSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading completed tasks" role="status">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#1C2940] dark:bg-[#0B1220]">
            <div className="flex items-center gap-3"><Pulse className="h-11 w-11" /><div className="flex-1 space-y-2"><Pulse className="h-3 w-24" /><Pulse className="h-7 w-20" /></div></div>
            <Pulse className="mt-3 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#1C2940] dark:bg-[#0B1220]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="space-y-2"><Pulse className="h-3 w-20" /><Pulse className="h-11 w-full" /></div>)}</div>
        <div className="mt-4 flex justify-end gap-2"><Pulse className="h-10 w-28" /><Pulse className="h-10 w-24" /></div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1C2940] dark:bg-[#0B1220]">
        <Pulse className="h-13 w-full rounded-none" />
        <div className="space-y-0">{Array.from({ length: 5 }, (_, index) => <div key={index} className="grid grid-cols-4 gap-4 border-t border-slate-100 p-4 dark:border-[#1C2940]"><Pulse className="h-9 w-full" /><Pulse className="h-9 w-full" /><Pulse className="h-9 w-full" /><Pulse className="h-9 w-full" /></div>)}</div>
      </div>
      <span className="sr-only">Loading completed tasks…</span>
    </div>
  );
}
