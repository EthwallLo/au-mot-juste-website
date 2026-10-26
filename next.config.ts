import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "proper-lockfile"],
  outputFileTracingExcludes: { "**/*": ["./.local/**/*", "./.env*", "./.git/**/*", "./tests/**/*"] },
  outputFileTracingIncludes: { "/*": ["./database/newsletter.sql"] },
  typescript: { tsconfigPath: process.env.NODE_ENV === "production" ? "tsconfig.build.json" : "tsconfig.json" },
};

export default withWorkflow(nextConfig);
