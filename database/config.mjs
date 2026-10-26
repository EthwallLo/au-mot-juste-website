import { createHash } from "node:crypto";
import path from "node:path";

export function getDatabaseMode(env = process.env) {
  return env.VERCEL === "1" && env.VERCEL_ENV !== "development" ? "neon" : "local";
}

export function getLocalDatabaseDirectory(env = process.env) {
  return path.resolve(env.LOCAL_DATABASE_PATH || ".local/database");
}

export function getDatabaseCacheNamespace(env = process.env) {
  const mode = getDatabaseMode(env);
  const identity = mode === "local" ? getLocalDatabaseDirectory(env) : env.DATABASE_URL || "";
  return `${mode}-${createHash("sha256").update(identity).digest("hex").slice(0, 20)}`;
}
