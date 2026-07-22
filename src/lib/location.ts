/** Product scope: US roles only (for now). */

const US_STATE_ABBR =
  /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/;

const US_POSITIVE =
  /\b(united states|u\.s\.a\.?|\busa\b|\bu\.s\.\b|\bamer\b|\bamericas?\b|\bremote[-\s]?us\b|\(us\)|, us\b)/i;

const NON_US = /\b(united kingdom|\buk\b|england|scotland|wales|canada|mexico|india|germany|france|ireland|australia|singapore|japan|china|hong kong|brazil|netherlands|sweden|norway|denmark|finland|switzerland|spain|italy|poland|israel|uae|dubai|korea|taiwan|philippines|indonesia|malaysia|vietnam|thailand|new zealand|emea|apac|latam|europe|asia pacific|london|toronto|vancouver|montreal|ottawa|dublin|sydney|melbourne|berlin|munich|paris|amsterdam|bangalore|bengaluru|hyderabad|mumbai|delhi|guadalajara|mexico city|s[aã]o paulo|costa rica|colombia|chile|argentina|peru|poland|warsaw|tel aviv|remote[-\s]?emea|remote[-\s]?eu)\b/i;

function joinHints(parts: Array<string | null | undefined>) {
  return parts
    .filter((p): p is string => Boolean(p && p.trim()))
    .join(" | ")
    .trim();
}

export function isUsCountryCode(code: string | null | undefined) {
  const c = (code ?? "").trim().toUpperCase();
  return c === "US" || c === "USA" || c === "UNITED STATES";
}

export function isUsCountryName(name: string | null | undefined) {
  if (!name) return false;
  return /^(united states|u\.s\.a\.?|usa|us)$/i.test(name.trim());
}

/**
 * True when location text looks US (or is empty — we default to US watches).
 * Explicit non-US cues win unless a clear US cue is also present.
 */
export function isUsLocationHint(
  ...parts: Array<string | null | undefined>
): boolean {
  const text = joinHints(parts);
  if (!text) return true;

  const hasUs = US_POSITIVE.test(text) || US_STATE_ABBR.test(text);
  const hasNonUs = NON_US.test(text);

  if (hasNonUs && !hasUs) return false;
  if (hasUs) return true;

  // Ambiguous city-only strings with no country signal — keep (US catalog default).
  return true;
}
