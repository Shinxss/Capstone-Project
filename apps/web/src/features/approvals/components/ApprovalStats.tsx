import { CircleCheck, CircleX, Clock3, FileText } from "lucide-react";

type Props = {
  pending: number;
  approvedToday: number;
  rejectedToday: number;
  totalThisWeek: number;
};

const cards = [
  {
    key: "pending" as const,
    label: "Pending Reports",
    support: "For verification",
    icon: Clock3,
    cardClass: "border-amber-200/80 bg-amber-50/45",
    iconClass: "bg-amber-100 text-amber-600",
  },
  {
    key: "approvedToday" as const,
    label: "Approved Today",
    support: "Verified today",
    icon: CircleCheck,
    cardClass: "border-emerald-200/80 bg-emerald-50/45",
    iconClass: "bg-emerald-100 text-emerald-600",
  },
  {
    key: "rejectedToday" as const,
    label: "Rejected Today",
    support: "Reviewed today",
    icon: CircleX,
    cardClass: "border-rose-200/80 bg-rose-50/45",
    iconClass: "bg-rose-100 text-rose-600",
  },
  {
    key: "totalThisWeek" as const,
    label: "Total Reports",
    support: "This week",
    icon: FileText,
    cardClass: "border-blue-200/80 bg-blue-50/45",
    iconClass: "bg-blue-100 text-blue-600",
  },
];

export default function ApprovalStats(props: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.key} className={`flex min-h-[104px] items-center gap-4 rounded-xl border px-4 py-3 ${card.cardClass}`}>
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${card.iconClass}`}>
              <Icon size={25} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-600">{card.label}</p>
              <p className="mt-0.5 text-2xl font-extrabold leading-none text-slate-950">{props[card.key]}</p>
              <p className="mt-2 text-xs text-slate-500">{card.support}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
