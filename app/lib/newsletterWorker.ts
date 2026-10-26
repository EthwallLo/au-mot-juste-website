import "server-only";
import { getAllBlogPosts } from "@/app/lib/blog";
import { isLocalNewsletterEnabled } from "@/app/lib/newsletterConfig";
import { getLocalNewsletterSnapshot, processLocalNewsletterPublications } from "@/app/lib/newsletterLocal";

export async function syncLocalNewsletter() {
  const posts = await getAllBlogPosts();
  return processLocalNewsletterPublications(posts);
}

export function startLocalNewsletterWorker() {
  if (!isLocalNewsletterEnabled()) return;
  const runtime = globalThis as typeof globalThis & { newsletterLocalTimer?: NodeJS.Timeout };
  if (runtime.newsletterLocalTimer) return;
  let running = false;
  let initialized = false;
  let reportedError = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const snapshot = await getLocalNewsletterSnapshot();
      if (!initialized || snapshot.subscribers.some((subscriber) => subscriber.status === "active")) {
        await syncLocalNewsletter();
        initialized = true;
      }
      reportedError = false;
    } catch {
      if (!reportedError) console.warn("La simulation de newsletter est en attente : vérifiez l’accès à la base des articles et aux fichiers locaux.");
      reportedError = true;
    } finally {
      running = false;
    }
  };
  runtime.newsletterLocalTimer = setInterval(() => void tick(), 15000);
  runtime.newsletterLocalTimer.unref();
  void tick();
}
