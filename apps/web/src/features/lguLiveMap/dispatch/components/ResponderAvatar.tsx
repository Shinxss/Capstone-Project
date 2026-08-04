import { responderInitials } from "../utils/dispatchResponder.utils";

type Props = { name: string; avatarUrl?: string; size?: "sm" | "md" | "lg" };

const sizeClasses = { sm: "h-8 w-8 text-[10px]", md: "h-11 w-11 text-xs", lg: "h-16 w-16 text-base" };

export default function ResponderAvatar({ name, avatarUrl, size = "md" }: Props) {
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-[#17243A] dark:text-slate-200 dark:ring-[#2B3A55] ${sizeClasses[size]}`}>
      {responderInitials(name)}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => event.currentTarget.remove()}
        />
      ) : null}
    </span>
  );
}
