import { api } from "../../../lib/api";

export type UploadMyAvatarPayload = {
  base64: string;
  mimeType?: "image/png" | "image/jpeg" | "image/heic";
  fileName?: string;
};

function asAvatarUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function extractAvatarUrl(payload: any): string | null {
  return (
    asAvatarUrl(payload?.avatarUrl) ??
    asAvatarUrl(payload?.user?.avatarUrl) ??
    asAvatarUrl(payload?.data?.avatarUrl) ??
    asAvatarUrl(payload?.data?.user?.avatarUrl)
  );
}

export async function uploadMyAvatar(payload: UploadMyAvatarPayload): Promise<{ avatarUrl: string }> {
  const response = await api.post("/api/users/me/avatar", payload);
  const avatarUrl = extractAvatarUrl(response.data);
  if (!avatarUrl) {
    throw new Error("Failed to upload avatar");
  }
  return { avatarUrl };
}

export async function removeMyAvatar(): Promise<{ avatarUrl: null }> {
  await api.delete("/api/users/me/avatar");
  return { avatarUrl: null };
}
