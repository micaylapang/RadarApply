import { getSupabaseAdmin } from "@/lib/supabase";
import {
  mapInternship,
  type Internship,
  type InternshipRow,
  type UserRow,
} from "@/lib/database.types";
import { dedupeByCompanyRole } from "@/lib/role-meta";

const USER_SELECT_FULL =
  "id, name, phone, created_at, season_pass_expires_at, stripe_customer_id, stripe_checkout_session_id";
const USER_SELECT_BASE = "id, name, phone, created_at";

let usersHaveSeasonPassColumns: boolean | null = null;

function normalizeUser(row: Record<string, unknown> | null): UserRow | null {
  if (!row) return null;
  return {
    id: String(row.id),
    name: String(row.name),
    phone: String(row.phone),
    password_hash: (row.password_hash as string | null | undefined) ?? null,
    created_at: String(row.created_at),
    season_pass_expires_at:
      (row.season_pass_expires_at as string | null | undefined) ?? null,
    stripe_customer_id:
      (row.stripe_customer_id as string | null | undefined) ?? null,
    stripe_checkout_session_id:
      (row.stripe_checkout_session_id as string | null | undefined) ?? null,
  };
}

function isMissingColumnError(
  error: { message?: string; code?: string } | null,
  columns: string[],
) {
  if (!error) return false;
  if (error.code === "42703") return true;
  const msg = (error.message ?? "").toLowerCase();
  return columns.some((col) => msg.includes(col.toLowerCase()));
}

function isMissingSeasonPassColumn(error: { message?: string; code?: string } | null) {
  return isMissingColumnError(error, [
    "season_pass_expires_at",
    "stripe_customer_id",
    "stripe_checkout_session_id",
  ]);
}

async function selectUser(
  build: (columns: string) => Promise<{
    data: Record<string, unknown> | null;
    error: { message?: string; code?: string } | null;
  }>,
): Promise<UserRow | null> {
  const preferFull = usersHaveSeasonPassColumns !== false;
  if (preferFull) {
    const full = await build(USER_SELECT_FULL);
    if (!full.error) {
      usersHaveSeasonPassColumns = true;
      return normalizeUser(full.data);
    }
    if (!isMissingSeasonPassColumn(full.error)) throw full.error;
    usersHaveSeasonPassColumns = false;
  }

  const base = await build(USER_SELECT_BASE);
  if (base.error) throw base.error;
  return normalizeUser(base.data);
}

export async function listInternships(): Promise<Internship[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("internships")
    .select("*")
    .order("company", { ascending: true })
    .order("title", { ascending: true });

  if (error) throw error;
  return (data as InternshipRow[]).map(mapInternship);
}

export async function getInternshipsByIds(ids: string[]): Promise<Internship[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("internships")
    .select("*")
    .in("id", ids);

  if (error) throw error;
  return (data as InternshipRow[]).map(mapInternship);
}

export async function getInternshipBySlug(slug: string): Promise<Internship | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("internships")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ? mapInternship(data as InternshipRow) : null;
}

export async function getInternshipById(id: string): Promise<Internship | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("internships")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapInternship(data as InternshipRow) : null;
}

export async function upsertUser(name: string, phone: string): Promise<UserRow> {
  const supabase = getSupabaseAdmin();

  const existing = await getUserByPhone(phone);

  if (existing) {
    const { data, error } = await supabase
      .from("users")
      .update({ name })
      .eq("id", existing.id)
      .select(USER_SELECT_BASE)
      .single();
    if (error) throw error;
    const refreshed = await getUserById(existing.id);
    return refreshed ?? normalizeUser(data as Record<string, unknown>)!;
  }

  const { data, error } = await supabase
    .from("users")
    .insert({ name, phone })
    .select(USER_SELECT_BASE)
    .single();

  if (error) throw error;
  const created = await getUserById(String((data as { id: string }).id));
  return created ?? normalizeUser(data as Record<string, unknown>)!;
}

export async function getUserByPhone(phone: string): Promise<UserRow | null> {
  const supabase = getSupabaseAdmin();
  return selectUser(async (columns) => {
    const { data, error } = await supabase
      .from("users")
      .select(columns)
      .eq("phone", phone)
      .maybeSingle();
    return {
      data: (data as Record<string, unknown> | null) ?? null,
      error,
    };
  });
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const supabase = getSupabaseAdmin();
  return selectUser(async (columns) => {
    const { data, error } = await supabase
      .from("users")
      .select(columns)
      .eq("id", id)
      .maybeSingle();
    return {
      data: (data as Record<string, unknown> | null) ?? null,
      error,
    };
  });
}

export async function updateUserPhone(
  userId: string,
  phone: string,
): Promise<UserRow> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("users")
    .update({ phone })
    .eq("id", userId);
  if (error) throw error;
  const updated = await getUserById(userId);
  if (!updated) throw new Error("User not found after phone update.");
  return updated;
}

export async function grantSeasonPass(opts: {
  userId: string;
  expiresAt: Date;
  stripeCustomerId?: string | null;
  stripeCheckoutSessionId?: string | null;
}): Promise<UserRow> {
  const supabase = getSupabaseAdmin();
  const patch: {
    season_pass_expires_at: string;
    stripe_customer_id?: string | null;
    stripe_checkout_session_id?: string | null;
  } = {
    season_pass_expires_at: opts.expiresAt.toISOString(),
  };
  if (opts.stripeCustomerId) {
    patch.stripe_customer_id = opts.stripeCustomerId;
  }
  if (opts.stripeCheckoutSessionId) {
    patch.stripe_checkout_session_id = opts.stripeCheckoutSessionId;
  }

  const { error } = await supabase
    .from("users")
    .update(patch)
    .eq("id", opts.userId);
  if (error) {
    if (isMissingSeasonPassColumn(error)) {
      throw new Error(
        "Season pass columns are missing. Run supabase/migrations/2026-07-21-season-pass.sql in the Supabase SQL Editor.",
      );
    }
    throw error;
  }
  usersHaveSeasonPassColumns = true;
  const updated = await getUserById(opts.userId);
  if (!updated) throw new Error("User not found after granting season pass.");
  return updated;
}

export async function getUserByStripeCheckoutSession(
  sessionId: string,
): Promise<UserRow | null> {
  if (usersHaveSeasonPassColumns === false) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select(USER_SELECT_FULL)
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  if (error) {
    if (isMissingSeasonPassColumn(error)) {
      usersHaveSeasonPassColumns = false;
      return null;
    }
    throw error;
  }
  usersHaveSeasonPassColumns = true;
  return normalizeUser(data as Record<string, unknown> | null);
}

export async function createLoginCode(phone: string, codeHash: string, expiresAt: Date) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("login_codes")
    .insert({
      phone,
      code_hash: codeHash,
      expires_at: expiresAt.toISOString(),
    })
    .select("id, created_at")
    .single();
  if (error) throw error;
  return data as { id: string; created_at: string };
}

export async function getLatestLoginCode(phone: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("login_codes")
    .select("id, phone, code_hash, attempts, expires_at, consumed_at, created_at")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as {
    id: string;
    phone: string;
    code_hash: string;
    attempts: number;
    expires_at: string;
    consumed_at: string | null;
    created_at: string;
  } | null;
}

export async function bumpLoginCodeAttempts(id: string, attempts: number) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("login_codes")
    .update({ attempts })
    .eq("id", id);
  if (error) throw error;
}

export async function consumeLoginCode(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("login_codes")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteUserSubscription(userId: string, internshipId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("internship_id", internshipId);
  if (error) throw error;
}

export async function upsertSubscriptions(userId: string, internshipIds: string[]) {
  const supabase = getSupabaseAdmin();
  const rows = internshipIds.map((internship_id) => ({
    user_id: userId,
    internship_id,
  }));

  const { error } = await supabase.from("subscriptions").upsert(rows, {
    onConflict: "user_id,internship_id",
    ignoreDuplicates: true,
  });

  if (error) throw error;
}

export async function listUserTracking(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "internship_id, internships ( id, company, title, status, opened_at )",
    )
    .eq("user_id", userId);

  if (error) throw error;

  type TrackingJoin = {
    internship_id: string;
    internships: {
      id: string;
      company: string;
      title: string;
      status: string;
      opened_at: string | null;
    } | null;
  };

  const rows = ((data ?? []) as unknown as TrackingJoin[]).map((row) => {
    const internship = row.internships;
    return {
      id: internship?.id ?? row.internship_id,
      company: internship?.company ?? "",
      title: internship?.title ?? "",
      status: internship?.status ?? "closed",
      openedAt: internship?.opened_at ?? null,
    };
  });

  return dedupeByCompanyRole(rows).sort((a, b) => {
    const byCompany = a.company.localeCompare(b.company);
    if (byCompany !== 0) return byCompany;
    return a.title.localeCompare(b.title);
  });
}

export type SignupReportWatch = {
  company: string;
  title: string;
  status: string;
};

export type SignupReportUser = {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  watchCount: number;
  watches: SignupReportWatch[];
};

export type SignupReportCount = {
  key: string;
  company: string;
  title?: string;
  count: number;
};

export type SignupReport = {
  users: SignupReportUser[];
  byCompany: SignupReportCount[];
  byRole: SignupReportCount[];
  totals: {
    users: number;
    subscriptions: number;
  };
};

/** Ops report: every subscriber + company/role popularity. */
export async function listSignupReport(): Promise<SignupReport> {
  const supabase = getSupabaseAdmin();

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, name, phone, created_at")
    .order("created_at", { ascending: false });

  if (usersError) throw usersError;

  const { data: subs, error: subsError } = await supabase
    .from("subscriptions")
    .select(
      "user_id, internships ( company, title, status )",
    );

  if (subsError) throw subsError;

  type SubJoin = {
    user_id: string;
    internships: {
      company: string;
      title: string;
      status: string;
    } | null;
  };

  const watchesByUser = new Map<string, SignupReportWatch[]>();
  const companyCounts = new Map<string, number>();
  const roleCounts = new Map<string, { company: string; title: string; count: number }>();

  for (const row of (subs ?? []) as unknown as SubJoin[]) {
    const internship = row.internships;
    if (!internship) continue;

    const watch = {
      company: internship.company,
      title: internship.title,
      status: internship.status,
    };
    const list = watchesByUser.get(row.user_id) ?? [];
    list.push(watch);
    watchesByUser.set(row.user_id, list);

    companyCounts.set(
      internship.company,
      (companyCounts.get(internship.company) ?? 0) + 1,
    );

    const roleKey = `${internship.company}::${internship.title}`;
    const existing = roleCounts.get(roleKey);
    if (existing) existing.count += 1;
    else {
      roleCounts.set(roleKey, {
        company: internship.company,
        title: internship.title,
        count: 1,
      });
    }
  }

  const reportUsers: SignupReportUser[] = (users ?? []).map((user) => {
    const watches = dedupeByCompanyRole(watchesByUser.get(user.id) ?? []).sort(
      (a, b) => {
        const byCompany = a.company.localeCompare(b.company);
        if (byCompany !== 0) return byCompany;
        return a.title.localeCompare(b.title);
      },
    );
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      createdAt: user.created_at,
      watchCount: watches.length,
      watches,
    };
  });

  const byCompany = Array.from(companyCounts.entries())
    .map(([company, count]) => ({ key: company, company, count }))
    .sort((a, b) => b.count - a.count || a.company.localeCompare(b.company));

  const byRole = Array.from(roleCounts.entries())
    .map(([key, value]) => ({
      key,
      company: value.company,
      title: value.title,
      count: value.count,
    }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.company.localeCompare(b.company) ||
        (a.title ?? "").localeCompare(b.title ?? ""),
    );

  return {
    users: reportUsers,
    byCompany,
    byRole,
    totals: {
      users: reportUsers.length,
      subscriptions: (subs ?? []).length,
    },
  };
}

export async function updateInternshipStatus(
  id: string,
  patch: {
    status?: string;
    openedAt?: string | null;
    lastChecked?: string | null;
    applyUrl?: string | null;
  },
) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("internships")
    .update({
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.openedAt !== undefined ? { opened_at: patch.openedAt } : {}),
      ...(patch.lastChecked !== undefined
        ? { last_checked: patch.lastChecked }
        : {}),
      ...(patch.applyUrl !== undefined ? { apply_url: patch.applyUrl } : {}),
    })
    .eq("id", id);

  if (error) throw error;
}

export async function resetSubscriptionAlerts(internshipId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("subscriptions")
    .update({ alerted_at: null })
    .eq("internship_id", internshipId);

  if (error) throw error;
}

export async function getPendingSubscriptions(internshipId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, user_id, internship_id, alerted_at, users ( id, name, phone )")
    .eq("internship_id", internshipId)
    .is("alerted_at", null);

  if (error) throw error;

  type PendingJoin = {
    id: string;
    user_id: string;
    internship_id: string;
    users: Pick<UserRow, "id" | "name" | "phone"> | null;
  };

  return ((data ?? []) as unknown as PendingJoin[]).map((row) => {
    const user = row.users;
    return {
      id: row.id,
      userId: row.user_id,
      internshipId: row.internship_id,
      user: {
        id: user?.id ?? row.user_id,
        name: user?.name ?? "",
        phone: user?.phone ?? "",
      },
    };
  });
}

export async function markSubscriptionAlerted(subscriptionId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("subscriptions")
    .update({ alerted_at: new Date().toISOString() })
    .eq("id", subscriptionId);

  if (error) throw error;
}

export async function createAlert(input: {
  userId: string;
  internshipId: string;
  phone: string;
  body: string;
  status: string;
  latencyMs: number | null;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("alerts").insert({
    user_id: input.userId,
    internship_id: input.internshipId,
    phone: input.phone,
    body: input.body,
    status: input.status,
    latency_ms: input.latencyMs,
  });

  if (error) throw error;
}

export async function upsertInternshipCatalogItem(item: {
  company: string;
  title: string;
  slug: string;
  description: string;
  applyUrl: string;
  sourceType: string;
  sourceKey: string | null;
  titleFilter: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("internships").upsert(
    {
      company: item.company,
      title: item.title,
      slug: item.slug,
      description: item.description,
      apply_url: item.applyUrl,
      source_type: item.sourceType,
      source_key: item.sourceKey,
      title_filter: item.titleFilter,
    },
    { onConflict: "slug" },
  );

  if (error) throw error;
}

export async function insertCompanyRequest(opts: {
  company: string;
  roles?: string | null;
  contact?: string | null;
}): Promise<{ id: string } | null> {
  // Table is optional until migration is applied; not in generated Database types yet.
  const supabase = getSupabaseAdmin() as unknown as {
    from: (table: string) => {
      insert: (row: Record<string, string | null>) => {
        select: (cols: string) => {
          single: () => Promise<{
            data: { id: string } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };

  const { data, error } = await supabase
    .from("company_requests")
    .insert({
      company: opts.company,
      roles: opts.roles?.trim() || null,
      contact: opts.contact?.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    // Table may not exist yet — caller can still deliver via email.
    console.error("[db] insertCompanyRequest", error.message);
    return null;
  }
  return data?.id ? { id: String(data.id) } : null;
}
