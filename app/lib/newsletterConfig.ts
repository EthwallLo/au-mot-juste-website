import { SITE_URL } from "./seo";

export function isProductionNewsletterEnabled() {
  return process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production" && process.env.NEWSLETTER_ENABLED === "true";
}

export function isNewsletterEnabled() {
  return isLocalNewsletterEnabled() || isProductionNewsletterEnabled();
}

export function getProductionNewsletterOrigin() {
  const url = new URL(process.env.NEWSLETTER_SITE_URL || SITE_URL);
  if (url.protocol !== "https:" || url.username || url.password || isLocalNewsletterOrigin(url.origin)) {
    throw new Error("L’adresse publique de la newsletter doit utiliser HTTPS.");
  }
  return url.origin;
}

export function isLocalNewsletterEnabled() {
  return process.env.NEWSLETTER_LOCAL_ENABLED === "true" && process.env.VERCEL !== "1";
}

export function isLocalNewsletterOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return ["http:", "https:"].includes(url.protocol) &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}
