import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";

export const dynamic = "force-static";

export default function LoginPage() {
  return (
    <div className="page">
      <SiteNav active="login" />

      <main className="auth-page">
        <Suspense
          fallback={
            <div className="auth-panel">
              <h1>Log In</h1>
              <p className="auth-lead">Loading…</p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
