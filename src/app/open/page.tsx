import type { Metadata } from "next";
import { OpenRolesBoard } from "@/components/OpenRolesBoard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Apply Now — RadarApply",
  description:
    "Direct apply links for internship roles RadarApply has confirmed are already open.",
};

export default function OpenRolesPage() {
  return (
    <div className="page">
      <SiteNav active="open" />

      <main className="open-page">
        <OpenRolesBoard />
      </main>

      <SiteFooter />
    </div>
  );
}
