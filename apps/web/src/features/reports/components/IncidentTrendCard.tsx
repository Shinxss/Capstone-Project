import { TrendingUp } from "lucide-react";
import { EMPTY_REPORT_MESSAGE } from "../constants/reports.constants";
import type { IncidentTrendPoint } from "../models/reports.types";

export default function IncidentTrendCard({ points, barangayName }: { points: IncidentTrendPoint[]; barangayName: string }) {
  const width = 700;
  const height = 220;
  const left = 42;
  const right = 16;
  const top = 24;
  const bottom = 38;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maxCount = Math.max(4, ...points.map((point) => point.count));
  const yMax = Math.ceil(maxCount / 5) * 5;
  const coordinates = points.map((point, index) => ({
    ...point,
    x: left + (index / Math.max(points.length - 1, 1)) * chartWidth,
    y: top + chartHeight - (point.count / yMax) * chartHeight,
  }));
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const area = coordinates.length
    ? `M ${coordinates[0]?.x} ${top + chartHeight} ${coordinates.map((point) => `L ${point.x} ${point.y}`).join(" ")} L ${coordinates.at(-1)?.x} ${top + chartHeight} Z`
    : "";

  return (
    <article className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_6px_20px_-18px_rgba(15,23,42,0.28)] dark:border-[#162544] dark:bg-[#0B1220]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <TrendingUp size={20} className="mt-0.5 text-rose-600" />
          <div><h2 className="text-[17px] font-bold leading-tight text-slate-950 dark:text-slate-100">Incident Trend</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Number of incidents reported in {barangayName}</p></div>
        </div>
        <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300">Monthly</span>
      </div>
      {points.length ? (
        <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-[210px] w-full" role="img" aria-label="Monthly incident trend">
          <defs><linearGradient id="incident-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F43F5E" stopOpacity="0.23" /><stop offset="100%" stopColor="#F43F5E" stopOpacity="0.02" /></linearGradient></defs>
          {[0, 1, 2, 3, 4].map((tick) => {
            const y = top + (tick / 4) * chartHeight;
            const value = Math.round(yMax - (tick / 4) * yMax);
            return <g key={tick}><line x1={left} x2={width - right} y1={y} y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="1" /><text x={left - 12} y={y + 4} textAnchor="end" fontSize="10" fill="currentColor" className="text-slate-400">{value}</text></g>;
          })}
          {coordinates.map((point) => <line key={`v-${point.key}`} x1={point.x} x2={point.x} y1={top} y2={top + chartHeight} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />)}
          <path d={area} fill="url(#incident-area)" />
          <polyline points={line} fill="none" stroke="#F43F5E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {coordinates.map((point) => <g key={point.key}><circle cx={point.x} cy={point.y} r="5" fill="#F43F5E" stroke="white" strokeWidth="2" /><text x={point.x} y={Math.max(12, point.y - 10)} textAnchor="middle" fontSize="10" fontWeight="700" fill="#E11D48">{point.count}</text><text x={point.x} y={height - 12} textAnchor="middle" fontSize="9.5" fill="currentColor" className="text-slate-500">{point.label}</text></g>)}
        </svg>
      ) : <div className="flex h-[210px] items-center justify-center text-sm text-slate-400">{EMPTY_REPORT_MESSAGE}</div>}
    </article>
  );
}
