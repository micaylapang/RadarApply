/**
 * Import historical company requests from FormSubmit archive or pasted email text.
 */

export type ImportedCompanyRequest = {
  company: string;
  roles: string | null;
  contact: string | null;
  createdAt?: string | null;
  source: "formsubmit" | "paste";
};

type FormSubmitSubmission = {
  submitted_at?: string | { date?: string };
  form_data?: Record<string, unknown>;
};

function pickField(
  data: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const direct = data[key];
    if (typeof direct === "string" && direct.trim()) return direct.trim();
    const lower = Object.entries(data).find(
      ([k]) => k.toLowerCase() === key.toLowerCase(),
    );
    if (lower && typeof lower[1] === "string" && lower[1].trim()) {
      return lower[1].trim();
    }
  }
  return null;
}

function normalizeRoles(roles: string | null) {
  if (!roles) return null;
  const cleaned = roles.trim();
  if (!cleaned || /^\(not specified\)$/i.test(cleaned)) return null;
  return cleaned;
}

function normalizeContact(contact: string | null) {
  if (!contact) return null;
  const cleaned = contact.trim();
  if (!cleaned || /^\(none\)$/i.test(cleaned)) return null;
  return cleaned;
}

function submittedAtIso(value: FormSubmitSubmission["submitted_at"]) {
  if (!value) return null;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof value === "object" && typeof value.date === "string") {
    const d = new Date(value.date);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

export function isCompanyRequestSubmission(
  data: Record<string, unknown>,
): boolean {
  const subject = pickField(data, ["_subject", "subject"]);
  const company = pickField(data, ["Company", "company"]);
  if (company) return true;
  if (subject && /company\s*request/i.test(subject)) return true;
  const message = pickField(data, ["message", "Message"]);
  return Boolean(message && /company add request|Company:/i.test(message));
}

export function parseFormSubmitSubmissions(
  payload: unknown,
): ImportedCompanyRequest[] {
  const root = payload as {
    submissions?: FormSubmitSubmission[];
    data?: FormSubmitSubmission[];
  };
  const list = root.submissions ?? root.data ?? [];
  if (!Array.isArray(list)) return [];

  const out: ImportedCompanyRequest[] = [];
  for (const row of list) {
    const data = (row.form_data ?? {}) as Record<string, unknown>;
    if (!isCompanyRequestSubmission(data)) continue;

    let company = pickField(data, ["Company", "company"]);
    let roles = normalizeRoles(pickField(data, ["Roles", "roles"]));
    let contact = normalizeContact(pickField(data, ["Contact", "contact"]));

    const message = pickField(data, ["message", "Message"]);
    if ((!company || !roles || !contact) && message) {
      const parsed = parseCompanyRequestEmailText(message);
      company = company || parsed.company;
      roles = roles || parsed.roles;
      contact = contact || parsed.contact;
    }

    if (!company) continue;
    out.push({
      company,
      roles,
      contact,
      createdAt: submittedAtIso(row.submitted_at),
      source: "formsubmit",
    });
  }
  return out;
}

/** Parse one or many pasted “Company: … Roles: …” email bodies. */
export function parseCompanyRequestEmailText(
  text: string,
): Omit<ImportedCompanyRequest, "source"> & { source?: "paste" } {
  const company =
    text.match(/^\s*Company:\s*(.+)$/im)?.[1]?.trim() ||
    text.match(/Company request:\s*(.+)$/im)?.[1]?.trim() ||
    null;
  const roles = normalizeRoles(
    text.match(/^\s*Roles:\s*(.+)$/im)?.[1]?.trim() || null,
  );
  const contact = normalizeContact(
    text.match(/^\s*Contact:\s*(.+)$/im)?.[1]?.trim() || null,
  );
  return { company: company ?? "", roles, contact };
}

export function parsePastedCompanyRequests(
  text: string,
): ImportedCompanyRequest[] {
  const chunks = text
    .split(/(?=RadarApply — company add request|Company request:)/i)
    .map((c) => c.trim())
    .filter(Boolean);

  const sources = chunks.length > 0 ? chunks : [text];
  const out: ImportedCompanyRequest[] = [];

  for (const chunk of sources) {
    const parsed = parseCompanyRequestEmailText(chunk);
    if (!parsed.company) continue;
    out.push({
      company: parsed.company,
      roles: parsed.roles,
      contact: parsed.contact,
      createdAt: null,
      source: "paste",
    });
  }

  return out;
}

export async function fetchFormSubmitSubmissions(apiKey: string) {
  const key = sanitizeFormSubmitApiKey(apiKey);
  if (!key) {
    throw new Error(
      "Paste your FormSubmit API key only (not the whole email). It’s in the FormSubmit message to radarapply@gmail.com.",
    );
  }

  const res = await fetch(
    `https://formsubmit.co/api/get-submissions/${key}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );
  const text = (await res.text()).trim();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    const looksHtml = /<!DOCTYPE|<html|cloudflare|just a moment/i.test(text);
    throw new Error(
      looksHtml
        ? "FormSubmit blocked the request. Paste the company-request email bodies below instead."
        : `FormSubmit returned a non-JSON response (${res.status}). Paste only the API key string, or use email paste import.`,
    );
  }

  const root = json as {
    success?: boolean;
    message?: string;
    submissions?: unknown;
  };

  if (root.success === false || root.submissions === false) {
    throw new Error(
      root.message?.trim() ||
        "FormSubmit rejected the API key. Request a new key and paste only the key string.",
    );
  }

  if (!res.ok) {
    throw new Error(root.message || `FormSubmit error (${res.status})`);
  }

  return parseFormSubmitSubmissions(json);
}

/** Strip labels/quotes people often paste from the FormSubmit email. */
export function sanitizeFormSubmitApiKey(raw: string) {
  let key = raw.trim();
  key = key.replace(/^["'`]+|["'`]+$/g, "");
  key = key.replace(/^(api\s*key|your\s*api\s*key|key)\s*[:=]\s*/i, "");

  const fromUrl = key.match(/get-submissions\/([^/?#\s]+)/i);
  if (fromUrl) {
    try {
      key = decodeURIComponent(fromUrl[1]);
    } catch {
      key = fromUrl[1];
    }
  }

  key = key.replace(/\s+/g, "");
  // Reject obvious full-email paste.
  if (!key || key.includes("@") || /^https?:/i.test(key)) return "";
  return key;
}
