import { Suspense } from "react";
import { SignupFlow } from "@/components/SignupFlow";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { getUserById, listUserTracking } from "@/lib/db";
import { companyLogoUrl } from "@/lib/company-logos";
import { INTERNSHIP_CATALOG } from "@/lib/internships";
import { getSessionUserId } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const catalogInternships = INTERNSHIP_CATALOG.map((item, i) => ({
  id: `catalog-${i}`,
  company: item.company,
  title: item.title,
  slug: item.slug,
  description: item.description,
  status: "closed",
  sourceType: item.sourceType,
  applyUrl: item.applyUrl,
  openedAt: null as string | null,
  logoUrl: companyLogoUrl(item.company),
}));

export default async function SignupPage() {
  let initialLoggedIn = false;
  let initialSession: {
    name: string;
    phone: string;
    tracking: Array<{ company: string; title: string }>;
  } | null = null;

  if (isSupabaseConfigured()) {
    try {
      const userId = await getSessionUserId();
      if (userId) {
        const user = await getUserById(userId);
        if (user) {
          initialLoggedIn = true;
          const tracking = await listUserTracking(user.id);
          initialSession = {
            name: user.name,
            phone: user.phone,
            tracking: tracking.map((t) => ({
              company: t.company,
              title: t.title,
            })),
          };
        }
      }
    } catch (err) {
      console.error("[signup page] session", err);
    }
  }

  return (
    <div className="page">
      <SiteNav active="signup" initialLoggedIn={initialLoggedIn} />

      <main className="signup-page">
        <Suspense
          fallback={
            <div className="signup-flow">
              <h1>Loading…</h1>
            </div>
          }
        >
          <SignupFlow
            initialInternships={catalogInternships}
            initialSession={initialSession}
          />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
