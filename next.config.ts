import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
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
