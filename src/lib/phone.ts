import { parsePhoneNumberFromString } from "libphonenumber-js";

export function normalizePhone(input: string, defaultCountry: "US" = "US") {
  const parsed = parsePhoneNumberFromString(input, defaultCountry);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.format("E.164");
}
