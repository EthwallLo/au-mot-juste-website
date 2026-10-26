export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NEXT_PHASE !== "phase-production-build") {
    const { isLocalNewsletterEnabled } = await import("./app/lib/newsletterConfig");
    if (isLocalNewsletterEnabled()) {
      const { startLocalNewsletterWorker } = await import("./app/lib/newsletterWorker");
      startLocalNewsletterWorker();
    }
  }
}
