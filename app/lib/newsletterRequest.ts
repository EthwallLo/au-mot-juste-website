import type { NextRequest } from "next/server";
import { isLocalNewsletterEnabled, isLocalNewsletterOrigin } from "@/app/lib/newsletterConfig";

export function getLocalNewsletterRequestOrigin(request: NextRequest) {
  try {
    // Next's development server can normalize nextUrl to localhost even when
    // the browser uses 127.0.0.1. Keep the actual request host for local links.
    const host = request.headers.get("host") || request.nextUrl.host;
    const origin = new URL(`${request.nextUrl.protocol}//${host}`).origin;
    return isLocalNewsletterOrigin(origin) ? origin : null;
  } catch {
    return null;
  }
}

export function isLocalNewsletterRequest(request: NextRequest) {
  const requestOrigin = getLocalNewsletterRequestOrigin(request);
  const browserOrigin = request.headers.get("origin");
  return isLocalNewsletterEnabled() && requestOrigin !== null &&
    (!browserOrigin || browserOrigin === requestOrigin);
}
