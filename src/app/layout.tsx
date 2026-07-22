import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "RadarApply — the fastest job alert system on the internet.",
  description:
    "Get text alerts the minute a job on your radar opens — because emails are outdated.",
  openGraph: {
    title: "RadarApply — the fastest job alert system on the internet.",
    description:
      "Get text alerts the minute a job on your radar opens — because emails are outdated.",
    siteName: "RadarApply",
    type: "website",
    url: "https://www.radarapply.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "RadarApply — the fastest job alert system on the internet.",
    description:
      "Get text alerts the minute a job on your radar opens — because emails are outdated.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
