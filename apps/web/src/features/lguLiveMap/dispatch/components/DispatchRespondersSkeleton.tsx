function Pulse({ className }: { className: string }) { return <span className={`block animate-pulse rounded-lg bg-slate-200 dark:bg-[#1C2A43] ${className}`} />; }

export default function DispatchRespondersSkeleton() {
  return (
    <div className="space-y-3 p-4 sm:p-6" aria-label="Loading responders" aria-busy="true" role="status">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="rounded-2xl border border-slate-200 p-4 dark:border-[#24334D]">
          <div className="flex gap-3"><Pulse className="h-16 w-16 shrink-0" /><div className="flex-1 space-y-2"><Pulse className="h-4 w-44" /><Pulse className="h-3 w-28" /><div className="flex gap-2"><Pulse className="h-6 w-16" /><Pulse className="h-6 w-20" /></div></div><Pulse className="h-9 w-9" /></div>
        </div>
      ))}
      <span className="sr-only">Loading responders…</span>
    </div>
  );
}
