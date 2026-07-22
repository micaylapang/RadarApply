import { parsePhoneNumberFromString } from "libphonenumber-js";

export function normalizePhone(input: string, defaultCountry: "US" = "US") {
  const parsed = parsePhoneNumberFromString(input, defaultCountry);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.format("E.164");
}

/** Display as (202) 733-0786; falls back to the original string. */
export function formatPhoneDisplay(
  input: string,
  defaultCountry: "US" = "US",
) {
  const parsed = parsePhoneNumberFromString(input, defaultCountry);
  if (!parsed || !parsed.isValid()) return input.trim();
  return parsed.formatNational();
}
