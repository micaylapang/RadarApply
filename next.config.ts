import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  eslint: {
    // eslint-config-next resolution is flaky on Vercel; typecheck still runs.
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: "/terms-and-conditions",
        destination: "/terms",
        permanent: true,
      },
      {
        source: "/terms-and-conditions/",
        destination: "/terms",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
