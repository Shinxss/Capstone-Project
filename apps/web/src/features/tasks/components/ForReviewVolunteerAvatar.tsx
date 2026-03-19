import { useEffect, useMemo, useState } from "react";

type Props = {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md";
};

function initialsFromName(name: string) {
  const cleaned = name.trim();
  if (!cleaned) return "V";
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "V";
}

export default function ForReviewVolunteerAvatar({ name, avatarUrl, size = "sm" }: Props) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl, name]);

  const initials = useMemo(() => initialsFromName(name), [name]);
  const hasImage = Boolean(avatarUrl) && !imageError;
  const sizeClass = size === "md" ? "h-14 w-14 text-base" : "h-7 w-7 text-[11px]";

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 font-bold text-gray-700 dark:border-[#2A3D63] dark:bg-[#0E1626] dark:text-slate-200",
        sizeClass,
      ].join(" ")}
      aria-hidden="true"
    >
      {hasImage ? (
        <img
          src={avatarUrl ?? undefined}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        initials
      )}
    </span>
  );
}
