import { redirect } from "next/navigation";
import { MONETIZATION_ENABLED } from "@/lib/limits";
import { Suspense } from "react";
import { UpgradeCheckout } from "@/components/UpgradeCheckout";

export const metadata = {
  title: "Season Pass · RadarApply",
  description:
    "Unlock unlimited company tracking for the Summer 2027 internship season — $10 one-time.",
};

export default function UpgradePage() {
  // Season pass kept in codebase; checkout paused while everything is free.
  if (!MONETIZATION_ENABLED) {
    redirect("/signup?add=1");
  }

  return (
    <main className="shell">
      <Suspense
        fallback={
          <div className="upgrade-page">
            <h1>Season pass</h1>
            <p className="upgrade-note">Loading…</p>
          </div>
        }
      >
        <UpgradeCheckout />
      </Suspense>
    </main>
  );
}
