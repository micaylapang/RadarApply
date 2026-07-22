import type { Metadata } from "next";
import { AdminSignupsPanel } from "@/components/AdminSignupsPanel";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Admin — RadarApply",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="page">
      <SiteNav />
      <main className="admin-page">
        <AdminSignupsPanel />
      </main>
      <SiteFooter />
    </div>
  );
}
