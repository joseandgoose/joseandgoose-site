import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Canonical domain is apex (joseandgoose.com). Redirect www -> apex (308),
  // preserving the path, so Google sees a single canonical host.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.joseandgoose.com" }],
        destination: "https://joseandgoose.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
