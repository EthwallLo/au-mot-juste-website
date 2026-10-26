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
