import { Check, Circle } from "lucide-react";

export default function DispatchProgress() {
  const steps = ["Accepted", "Dispatched", "En Route", "On Site"];
  return (
    <div aria-label="Dispatch progress" className="w-full">
      <div className="grid grid-cols-4">
        {steps.map((step, index) => {
          const completed = index < 2;
          const current = index === 2;
          return (
            <div key={step} className="relative flex flex-col items-center text-center">
              {index > 0 ? <span className={`absolute right-1/2 top-3 h-0.5 w-full ${index <= 2 ? "bg-red-300 dark:bg-red-500/50" : "bg-slate-200 dark:bg-slate-700"}`} /> : null}
              <span className={`relative z-10 grid size-6 place-items-center rounded-full border-2 ${completed ? "border-red-600 bg-red-600 text-white" : current ? "border-red-600 bg-white text-red-600 dark:bg-[#0B1220]" : "border-slate-300 bg-white text-slate-300 dark:border-slate-600 dark:bg-[#0B1220]"}`}>
                {completed ? <Check size={13} strokeWidth={3} /> : current ? <span className="size-2 rounded-full bg-red-600" /> : <Circle size={8} fill="currentColor" />}
              </span>
              <span className={`mt-2 text-[10px] font-bold sm:text-xs ${current ? "text-slate-950 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>{step}</span>
              {current ? <span className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">ETA —</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
