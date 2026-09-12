import {
  Construction,
  Droplets,
  Flame,
  Mountain,
  ShieldAlert,
} from "lucide-react";

type Props = {
  minimized: boolean;
  onToggle: () => void;
};

const hazardItems = [
  {
    label: "Flooded",
    icon: <Droplets size={11} strokeWidth={1.9} />,
    colorClass: "border-sky-200 text-sky-500",
  },
  {
    label: "Road Closed",
    icon: <Construction size={11} strokeWidth={1.9} />,
    colorClass: "border-rose-200 text-rose-400",
  },
  {
    label: "Fire Risk",
    icon: <Flame size={11} strokeWidth={1.9} />,
    colorClass: "border-orange-200 text-orange-500",
  },
  {
    label: "Landslide",
    icon: <Mountain size={11} strokeWidth={1.9} />,
    colorClass: "border-purple-200 text-purple-500",
  },
  {
    label: "Unsafe",
    icon: <ShieldAlert size={11} strokeWidth={1.9} />,
    colorClass: "border-amber-200 text-amber-500",
  },
];

export default function MapLegend({ minimized, onToggle }: Props) {
  return (
    <div className="w-[188px] overflow-hidden rounded-[10px] border border-slate-300 bg-white text-slate-700 shadow-md">
      <div className="flex h-8 items-center justify-between border-b border-slate-200 px-2.5">
        <div className="text-[10px] font-extrabold text-slate-900">Legend</div>
        <button
          type="button"
          onClick={onToggle}
          className="grid h-5 w-5 place-items-center rounded text-[12px] font-bold leading-none text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-expanded={!minimized}
          aria-label={minimized ? "Expand legend" : "Minimize legend"}
          title={minimized ? "Expand" : "Minimize"}
        >
          {minimized ? "+" : "−"}
        </button>
      </div>

      {!minimized ? (
        <div className="px-2.5 pb-2.5 pt-2">
          <div className="mb-1.5 text-[9px] font-bold leading-3 text-slate-600">Hazard Zones</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            {hazardItems.map((item) => (
              <div key={item.label} className="flex min-w-0 items-center gap-1.5">
                <span
                  className={`grid h-[17px] w-[17px] shrink-0 place-items-center rounded-[4px] border bg-white ${item.colorClass}`}
                >
                  {item.icon}
                </span>
                <span className="truncate text-[9px] leading-3 text-slate-600">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="mb-1.5 mt-2 text-[9px] font-bold leading-3 text-slate-600">
            Responders &amp; Volunteers
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
              <span className="text-[9px] leading-3 text-slate-600">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 border-2 border-red-500 bg-white" />
              <span className="text-[9px] leading-3 text-slate-600">Busy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-px w-3 shrink-0 bg-slate-500" />
              <span className="text-[9px] leading-3 text-slate-600">Idle</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
