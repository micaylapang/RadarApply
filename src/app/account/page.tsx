import { AccountPanel } from "@/components/AccountPanel";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const userId = await getSessionUserId();

  return (
    <div className="page">
      <SiteNav active="account" initialLoggedIn={Boolean(userId)} />

      <main className="auth-page">
        <AccountPanel />
      </main>

      <SiteFooter />
    </div>
  );
}
