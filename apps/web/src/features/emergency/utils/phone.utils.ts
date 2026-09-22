/**
 * Converts formatted phone numbers into safe `tel:` protocol values.
 *
 * Rules:
 * - Removes spaces, hyphens, and parentheses
 * - Preserves leading '+'
 * - Preserves the actual number without automatically converting local PH numbers to +63
 * - Does not invent missing numbers
 */
export function normalizePhoneForTel(phone?: string | null): string {
  if (!phone) return "";
  const trimmed = String(phone).trim();
  if (!trimmed) return "";

  const hasLeadingPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");
  if (!digitsOnly) return "";

  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
}
