export async function register() {
  // Production mail is handled by durable workflows; the preview worker is development-only.
  if (process.env.NODE_ENV !== "production" && process.env.NEXT_RUNTIME === "nodejs") {
    const { isLocalNewsletterEnabled } = await import("./app/lib/newsletterConfig");
    if (isLocalNewsletterEnabled()) {
      const { startLocalNewsletterWorker } = await import("./app/lib/newsletterWorker");
      startLocalNewsletterWorker();
    }
  }
}
