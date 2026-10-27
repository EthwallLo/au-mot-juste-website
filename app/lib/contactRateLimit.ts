import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { neon } from "@neondatabase/serverless";
import { getDatabaseMode } from "@/database/config.mjs";

export const CONTACT_RATE_LIMIT = 5;
export const CONTACT_RATE_WINDOW_SECONDS = 3600;

async function query(statement: string, parameters: unknown[] = []) {
  if (getDatabaseMode(process.env) === "local") {
    const { queryLocalDatabase } = await import("@/database/local.mjs");
    return queryLocalDatabase(statement, parameters, process.env);
  }
  if (!process.env.DATABASE_URL) throw new Error("CONTACT_DATABASE_UNAVAILABLE");
  return neon(process.env.DATABASE_URL).query(statement, parameters);
}

let schemaReady: Promise<unknown> | undefined;

export async function allowContactRequest(request: Request, secret: string) {
  let identity = "local";
  if (process.env.VERCEL === "1") {
    // These headers are set by Vercel. Ignore arbitrary forwarded headers locally.
    identity = (request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "").split(",")[0].trim();
    if (!isIP(identity)) throw new Error("CONTACT_CLIENT_ADDRESS_UNAVAILABLE");
  }
  if (!secret) throw new Error("CONTACT_SECRET_UNAVAILABLE");
  const bucket = createHmac("sha256", secret).update(`contact:v1:${identity}`).digest("hex");

  await (schemaReady ??= query(`CREATE TABLE IF NOT EXISTS public.contact_rate_limits (
    bucket text PRIMARY KEY,
    count integer NOT NULL DEFAULT 1,
    expires_at timestamptz NOT NULL
  )`).catch(error => { schemaReady = undefined; throw error; }));
  await query("DELETE FROM public.contact_rate_limits WHERE expires_at <= now()");
  // The conditional UPSERT also enforces the limit across concurrent Vercel instances.
  const rows = await query(`INSERT INTO public.contact_rate_limits (bucket, count, expires_at)
    VALUES ($1, 1, now() + $2 * interval '1 second')
    ON CONFLICT (bucket) DO UPDATE SET
      count = CASE WHEN contact_rate_limits.expires_at <= now() THEN 1 ELSE contact_rate_limits.count + 1 END,
      expires_at = CASE WHEN contact_rate_limits.expires_at <= now() THEN now() + $2 * interval '1 second' ELSE contact_rate_limits.expires_at END
    WHERE contact_rate_limits.expires_at <= now() OR contact_rate_limits.count < $3
    RETURNING bucket`, [bucket, CONTACT_RATE_WINDOW_SECONDS, CONTACT_RATE_LIMIT]);
  return rows.length > 0;
}
