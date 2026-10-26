import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "proper-lockfile"],
  outputFileTracingExcludes: { "/*": ["./.local/**/*"] },
};

export default nextConfig;
