export function normalizePhoneNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const hasLeadingPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";

  return hasLeadingPlus ? `+${digits}` : digits;
}

export function buildDestinationPhone(countryRegion: string, phoneNumber: string) {
  const normalizedCountryRegion = countryRegion.trim();
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  if (!normalizedCountryRegion) return normalizedPhoneNumber;
  if (!normalizedPhoneNumber) return normalizedCountryRegion;
  return `${normalizedCountryRegion} ${normalizedPhoneNumber}`;
}
