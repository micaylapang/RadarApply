import { getSupabaseAdmin } from "@/lib/supabase";
import {
  mapInternship,
  type Internship,
  type InternshipRow,
  type UserRow,
} from "@/lib/database.types";

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

  const { data: existing, error: findError } = await supabase
    .from("users")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (findError) throw findError;

  if (existing) {
    const { data, error } = await supabase
      .from("users")
      .update({ name })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as UserRow;
  }

  const { data, error } = await supabase
    .from("users")
    .insert({ name, phone })
    .select("*")
    .single();

  if (error) throw error;
  return data as UserRow;
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
    .select("internship_id, internships ( id, company, title, status )")
    .eq("user_id", userId);

  if (error) throw error;

  type TrackingJoin = {
    internship_id: string;
    internships: {
      id: string;
      company: string;
      title: string;
      status: string;
    } | null;
  };

  return ((data ?? []) as unknown as TrackingJoin[]).map((row) => {
    const internship = row.internships;
    return {
      id: internship?.id ?? row.internship_id,
      company: internship?.company ?? "",
      title: internship?.title ?? "",
      status: internship?.status ?? "closed",
    };
  });
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
