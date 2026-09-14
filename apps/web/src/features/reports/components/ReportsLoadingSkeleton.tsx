function Block({ className = "" }: { className?: string }) { return <div className={`rounded-xl bg-slate-200/70 dark:bg-slate-800 ${className}`} />; }

export default function ReportsLoadingSkeleton() {
  return (
    <div className="animate-pulse px-4 py-4 sm:px-5 lg:px-6">
      <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><Block className="h-11 w-11" /><div><Block className="h-5 w-48" /><Block className="mt-2 h-3 w-64" /></div></div><Block className="hidden h-10 w-[560px] xl:block" /></div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-[122px] rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]"><Block className="h-10 w-10" /><Block className="mt-3 h-6 w-20" /><Block className="mt-2 h-3 w-28" /></div>)}</div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">{Array.from({ length: 6 }, (_, index) => <div key={index} className={`rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220] ${index < 2 ? "h-[320px]" : "h-[235px]"} xl:col-span-6`}><Block className="h-5 w-44" /><Block className="mt-2 h-3 w-60" /><Block className="mt-5 h-[calc(100%-52px)] w-full" /></div>)}</div>
    </div>
  );
}
