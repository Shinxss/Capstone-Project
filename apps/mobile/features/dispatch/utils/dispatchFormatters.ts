import type { DispatchOffer } from "../models/dispatch";

function normalizeText(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function toTitleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatEmergencyType(value: unknown) {
  const normalized = normalizeText(value);
  if (!normalized) return "Emergency";
  return toTitleCase(normalized);
}

export function getDispatchTitle(offer: DispatchOffer | null | undefined) {
  if (!offer) return "Emergency Dispatch";
  return `${formatEmergencyType(offer.emergency?.emergencyType)} Emergency`;
}

export function getDispatchNotes(offer: DispatchOffer | null | undefined) {
  return normalizeText(offer?.emergency?.notes);
}

export function getDispatchLocationLabel(offer: DispatchOffer | null | undefined) {
  const barangay = normalizeText(offer?.emergency?.barangayName);
  if (barangay) return `Brgy. ${barangay}`;
  return "Location unavailable";
}

export function getDispatchCoordinatesLabel(offer: DispatchOffer | null | undefined) {
  const lat = Number(offer?.emergency?.lat);
  const lng = Number(offer?.emergency?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function getDispatchProofCount(offer: DispatchOffer | null | undefined) {
  return Array.isArray(offer?.proofs) ? offer.proofs.length : 0;
}

export function formatDispatchProofCount(offer: DispatchOffer | null | undefined) {
  const count = getDispatchProofCount(offer);
  return `${count} proof${count === 1 ? "" : "s"}`;
}

export function getDispatchLatestProofTime(offer: DispatchOffer | null | undefined) {
  if (!Array.isArray(offer?.proofs) || offer.proofs.length === 0) return null;
  const latest = [...offer.proofs]
    .filter((proof) => proof?.uploadedAt)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
  return latest?.uploadedAt ?? null;
}

export function formatDateTime(value: unknown) {
  const raw = normalizeText(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed.toLocaleString();
}

export function formatShortHash(value: unknown, max = 12) {
  const raw = normalizeText(value);
  if (!raw) return null;
  if (raw.length <= max) return raw;
  return `${raw.slice(0, 8)}...${raw.slice(-4)}`;
}
