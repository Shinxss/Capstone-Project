export type CountryRegionOption = {
  name: string;
  dialCode: string;
  isoCode: string;
};

export const COUNTRY_REGION_OPTIONS: CountryRegionOption[] = [
  { name: "Philippines", dialCode: "+63", isoCode: "PH" },
  { name: "Andorra", dialCode: "+376", isoCode: "AD" },
  { name: "United Arab Emirates", dialCode: "+971", isoCode: "AE" },
  { name: "Afghanistan", dialCode: "+93", isoCode: "AF" },
  { name: "Antigua & Barbuda", dialCode: "+1", isoCode: "AG" },
  { name: "Anguilla", dialCode: "+1", isoCode: "AI" },
  { name: "Albania", dialCode: "+355", isoCode: "AL" },
  { name: "Armenia", dialCode: "+374", isoCode: "AM" },
  { name: "Curacao", dialCode: "+599", isoCode: "CW" },
  { name: "Angola", dialCode: "+244", isoCode: "AO" },
  { name: "Argentina", dialCode: "+54", isoCode: "AR" },
  { name: "American Samoa", dialCode: "+1", isoCode: "AS" },
  { name: "Austria", dialCode: "+43", isoCode: "AT" },
  { name: "Australia", dialCode: "+61", isoCode: "AU" },
  { name: "United States", dialCode: "+1", isoCode: "US" },
  { name: "Canada", dialCode: "+1", isoCode: "CA" },
  { name: "United Kingdom", dialCode: "+44", isoCode: "GB" },
  { name: "Singapore", dialCode: "+65", isoCode: "SG" },
  { name: "Japan", dialCode: "+81", isoCode: "JP" },
  { name: "South Korea", dialCode: "+82", isoCode: "KR" },
  { name: "India", dialCode: "+91", isoCode: "IN" },
  { name: "Malaysia", dialCode: "+60", isoCode: "MY" },
  { name: "Indonesia", dialCode: "+62", isoCode: "ID" },
  { name: "Thailand", dialCode: "+66", isoCode: "TH" },
  { name: "Vietnam", dialCode: "+84", isoCode: "VN" },
  { name: "Brazil", dialCode: "+55", isoCode: "BR" },
  { name: "Mexico", dialCode: "+52", isoCode: "MX" },
  { name: "Germany", dialCode: "+49", isoCode: "DE" },
  { name: "France", dialCode: "+33", isoCode: "FR" },
  { name: "Spain", dialCode: "+34", isoCode: "ES" },
  { name: "Italy", dialCode: "+39", isoCode: "IT" },
  { name: "Netherlands", dialCode: "+31", isoCode: "NL" },
  { name: "Saudi Arabia", dialCode: "+966", isoCode: "SA" },
  { name: "Qatar", dialCode: "+974", isoCode: "QA" },
  { name: "Bahrain", dialCode: "+973", isoCode: "BH" },
  { name: "Kuwait", dialCode: "+965", isoCode: "KW" },
  { name: "Oman", dialCode: "+968", isoCode: "OM" },
  { name: "South Africa", dialCode: "+27", isoCode: "ZA" },
  { name: "New Zealand", dialCode: "+64", isoCode: "NZ" },
  { name: "Pakistan", dialCode: "+92", isoCode: "PK" },
  { name: "Bangladesh", dialCode: "+880", isoCode: "BD" },
  { name: "Nepal", dialCode: "+977", isoCode: "NP" },
  { name: "Sri Lanka", dialCode: "+94", isoCode: "LK" },
  { name: "Turkey", dialCode: "+90", isoCode: "TR" },
];

export const DEFAULT_COUNTRY_REGION = "Philippines (+63)";

export function toCountryRegionValue(option: CountryRegionOption) {
  return `${option.name} (${option.dialCode})`;
}

export function flagFromIsoCode(isoCode: string) {
  return isoCode
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2)
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}
