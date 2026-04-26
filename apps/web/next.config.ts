import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  typedRoutes: false,
  serverExternalPackages: [
    "@libsql/client",
    "@libsql/hrana-client",
    "@libsql/isomorphic-ws",
    "drizzle-orm",
  ],
};

export default nextConfig;
