const NORMALIZED_PH_MOBILE_PATTERN = /^\+639\d{9}$/;

export function normalizeGuestReporterName(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function normalizeGuestReporterPhone(value: unknown): string | null {
  const compact = String(value ?? "").trim().replace(/[\s()-]/g, "");
  const normalized = /^09\d{9}$/.test(compact)
    ? `+63${compact.slice(1)}`
    : compact;

  return NORMALIZED_PH_MOBILE_PATTERN.test(normalized) ? normalized : null;
}
