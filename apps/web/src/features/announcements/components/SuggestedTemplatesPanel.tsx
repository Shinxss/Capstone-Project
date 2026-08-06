import { ChevronRight, CloudRain, Footprints, Lightbulb, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import { ANNOUNCEMENT_TEMPLATES } from "../constants/announcementDashboard.constants";
import type { AnnouncementTemplate } from "../models/announcements.types";

function TemplateIcon({ category }: { category: AnnouncementTemplate["category"] }) {
  if (category === "FLOOD" || category === "WEATHER") return <CloudRain size={23} />;
  if (category === "VOLUNTEER") return <Users size={23} />;
  if (category === "EVACUATION") return <Footprints size={23} />;
  return <ShieldCheck size={23} />;
}

export default function SuggestedTemplatesPanel({ onUse, revealAll = false }: { onUse: (template: AnnouncementTemplate) => void; revealAll?: boolean }) {
  const [showAll, setShowAll] = useState(revealAll);
  const templates = showAll ? ANNOUNCEMENT_TEMPLATES : ANNOUNCEMENT_TEMPLATES.slice(0, 3);
  return <aside id="announcement-templates" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1C2940] dark:bg-[#0B1220]"><div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-[#1C2940]"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300"><Lightbulb size={17} /></span><h2 className="font-black text-slate-950 dark:text-white">Suggested Templates</h2></div><button type="button" onClick={() => setShowAll((current) => !current)} className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">{showAll ? "Show suggested" : "View all templates"}<ChevronRight size={14} /></button></div><div className="space-y-2 p-3">{templates.map((template, index) => <article key={template.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center dark:border-[#24324A]"><span className={`grid size-12 shrink-0 place-items-center rounded-xl ${index % 3 === 0 ? "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" : index % 3 === 1 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300"}`}><TemplateIcon category={template.category} /></span><div className="min-w-0 flex-1"><h3 className="text-sm font-black text-slate-900 dark:text-white">{template.title}</h3><p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{template.description}</p></div><button type="button" onClick={() => onUse(template)} className="h-10 shrink-0 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10">Use Template</button></article>)}</div><p className="flex items-center justify-center gap-2 border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-center text-xs text-slate-500 dark:border-[#1C2940] dark:bg-[#0E1626] dark:text-slate-400"><Lightbulb size={14} /> Templates help you save time and keep messages clear.</p></aside>;
}
