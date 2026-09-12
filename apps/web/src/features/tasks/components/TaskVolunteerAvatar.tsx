import { useState } from "react";
import { getInitials, resolveTaskAvatarUrl } from "../completed/utils/completedTask.utils";

type Props = {
  name?: string | null;
  avatarUrl?: string | null;
  imageClassName?: string;
};

export default function TaskVolunteerAvatar({
  name,
  avatarUrl,
  imageClassName = "h-full w-full object-cover",
}: Props) {
  const resolvedUrl = resolveTaskAvatarUrl(avatarUrl);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (resolvedUrl && failedUrl !== resolvedUrl) {
    return (
      <img
        src={resolvedUrl}
        alt={`${String(name ?? "Volunteer").trim() || "Volunteer"} profile`}
        className={imageClassName}
        onError={() => setFailedUrl(resolvedUrl)}
      />
    );
  }

  return <>{getInitials(name)}</>;
}
