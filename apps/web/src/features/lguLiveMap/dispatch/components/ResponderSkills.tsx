export default function ResponderSkills({ skills, highlighted }: { skills: string[]; highlighted: boolean }) {
  const visible = skills.slice(0, 3);
  const hiddenCount = Math.max(0, skills.length - visible.length);
  return (
    <div className="flex flex-wrap gap-1.5" title={skills.join(", ")}>
      {visible.map((skill, index) => (
        <span key={`${skill}-${index}`} className={`rounded-lg border px-2 py-0.5 text-[11px] font-medium ${highlighted && index === 0 ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300" : "border-slate-200 bg-white text-slate-600 dark:border-[#2B3A55] dark:bg-[#101A2B] dark:text-slate-300"}`}>
          {skill}
        </span>
      ))}
      {hiddenCount > 0 ? <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:border-[#2B3A55] dark:bg-[#17243A] dark:text-slate-300">+{hiddenCount}</span> : null}
    </div>
  );
}
