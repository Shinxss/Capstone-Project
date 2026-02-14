import type { ReactNode } from "react";

type Variant = "info" | "success" | "warning" | "error";

const stylesByVariant: Record<
  Variant,
  { wrap: string; title: string; icon: string; label: string }
> = {
  info: {
    wrap: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200",
    title: "text-blue-900 dark:text-blue-100",
    icon: "bg-blue-500",
    label: "Info",
  },
  success: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200",
    title: "text-emerald-900 dark:text-emerald-100",
    icon: "bg-emerald-500",
    label: "Success",
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200",
    title: "text-amber-900 dark:text-amber-100",
    icon: "bg-amber-500",
    label: "Warning",
  },
  error: {
    wrap: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200",
    title: "text-red-900 dark:text-red-100",
    icon: "bg-red-500",
    label: "Error",
  },
};

export default function InlineAlert({
  variant = "info",
  title,
  children,
}: {
  variant?: Variant;
  title?: string;
  children: ReactNode;
}) {
  const s = stylesByVariant[variant];

  return (
    <div className={["rounded-lg border px-4 py-3", s.wrap].join(" ")}>
      <div className="flex items-start gap-3">
        <span className={["mt-1 h-2.5 w-2.5 shrink-0 rounded-full", s.icon].join(" ")} />
        <div className="min-w-0">
          <div className={["text-sm font-semibold", s.title].join(" ")}>
            {title || s.label}
          </div>
          <div className="mt-0.5 text-sm leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

