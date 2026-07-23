export type InternshipRow = {
  id: string;
  company: string;
  title: string;
  slug: string;
  description: string | null;
  apply_url: string | null;
  source_type: string;
  source_key: string | null;
  title_filter: string | null;
  status: string;
  opened_at: string | null;
  last_checked: string | null;
  managed_by: string;
  logo_url?: string | null;
  created_at: string;
};

export type CompanyRequestRow = {
  id: string;
  company: string;
  roles: string | null;
  contact: string | null;
  status: string;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
};

export type UserRow = {
  id: string;
  name: string;
  phone: string;
  password_hash: string | null;
  season_pass_expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_checkout_session_id: string | null;
  created_at: string;
};

export type SubscriptionRow = {
  id: string;
  user_id: string;
  internship_id: string;
  created_at: string;
  alerted_at: string | null;
};

export type AlertRow = {
  id: string;
  user_id: string;
  internship_id: string;
  phone: string;
  body: string;
  status: string;
  latency_ms: number | null;
  created_at: string;
};

export type LoginCodeRow = {
  id: string;
  phone: string;
  code_hash: string;
  attempts: number;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: {
          id?: string;
          name: string;
          phone: string;
          password_hash?: string | null;
          season_pass_expires_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_checkout_session_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          password_hash?: string | null;
          season_pass_expires_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_checkout_session_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      internships: {
        Row: InternshipRow;
        Insert: {
          id?: string;
          company: string;
          title: string;
          slug: string;
          description?: string | null;
          apply_url?: string | null;
          source_type?: string;
          source_key?: string | null;
          title_filter?: string | null;
          status?: string;
          opened_at?: string | null;
          last_checked?: string | null;
          managed_by?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          apply_url?: string | null;
          source_type?: string;
          source_key?: string | null;
          title_filter?: string | null;
          status?: string;
          opened_at?: string | null;
          last_checked?: string | null;
          managed_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      company_requests: {
        Row: CompanyRequestRow;
        Insert: {
          id?: string;
          company: string;
          roles?: string | null;
          contact?: string | null;
          status?: string;
          reviewed_at?: string | null;
          review_note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company?: string;
          roles?: string | null;
          contact?: string | null;
          status?: string;
          reviewed_at?: string | null;
          review_note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: {
          id?: string;
          user_id: string;
          internship_id: string;
          created_at?: string;
          alerted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          internship_id?: string;
          created_at?: string;
          alerted_at?: string | null;
        };
        Relationships: [];
      };
      alerts: {
        Row: AlertRow;
        Insert: {
          id?: string;
          user_id: string;
          internship_id: string;
          phone: string;
          body: string;
          status?: string;
          latency_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          internship_id?: string;
          phone?: string;
          body?: string;
          status?: string;
          latency_ms?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      login_codes: {
        Row: LoginCodeRow;
        Insert: {
          id?: string;
          phone: string;
          code_hash: string;
          attempts?: number;
          expires_at: string;
          consumed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          code_hash?: string;
          attempts?: number;
          expires_at?: string;
          consumed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/** App-facing internship shape (camelCase) */
export type Internship = {
  id: string;
  company: string;
  title: string;
  slug: string;
  description: string | null;
  applyUrl: string | null;
  sourceType: string;
  sourceKey: string | null;
  titleFilter: string | null;
  status: string;
  openedAt: string | null;
  lastChecked: string | null;
  logoUrl: string | null;
  createdAt: string;
};

export function mapInternship(row: InternshipRow): Internship {
  return {
    id: row.id,
    company: row.company,
    title: row.title,
    slug: row.slug,
    description: row.description,
    applyUrl: row.apply_url,
    sourceType: row.source_type,
    sourceKey: row.source_key,
    titleFilter: row.title_filter,
    status: row.status,
    openedAt: row.opened_at,
    lastChecked: row.last_checked,
    logoUrl: (row as InternshipRow).logo_url ?? null,
    createdAt: row.created_at,
  };
}
