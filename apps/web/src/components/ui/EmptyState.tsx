import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  className = "",
}: Props) {
  return (
    <div className={["flex min-h-[260px] w-full items-center justify-center", className].join(" ").trim()}>
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-[#0E1626] dark:text-slate-300">
          <Icon size={24} />
        </div>

        <div className="text-sm font-semibold text-gray-800 dark:text-slate-200">{title}</div>
        {description ? <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{description}</div> : null}
      </div>
    </div>
  );
}

