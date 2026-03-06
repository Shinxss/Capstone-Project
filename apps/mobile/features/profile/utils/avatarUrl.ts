function asNullableString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function resolveAvatarUri(value?: string | null) {
  const avatar = asNullableString(value);
  if (!avatar) return null;
  if (/^https?:\/\//i.test(avatar)) return avatar;

  const base = String(process.env.EXPO_PUBLIC_API_URL ?? "").trim();
  if (!base) return avatar;

  try {
    const baseUrl = new URL(base);
    const origin = `${baseUrl.protocol}//${baseUrl.host}`;
    return new URL(avatar, origin).toString();
  } catch {
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const normalizedPath = avatar.startsWith("/") ? avatar : `/${avatar}`;
    return `${normalizedBase}${normalizedPath}`;
  }
}
