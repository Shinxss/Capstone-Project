import { api } from "../../../lib/api";
import { normalizeProfileSummary, type ProfileSummary } from "../models/profile";

export async function getProfileSummary(): Promise<ProfileSummary> {
  const response = await api.get("/api/users/me/profile-summary");
  return normalizeProfileSummary(response.data);
}
