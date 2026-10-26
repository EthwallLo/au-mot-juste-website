import "server-only";
import { getRun, start } from "workflow/api";
import { publishArticleNewsletter } from "@/workflows/newsletter";
import { isProductionNewsletterEnabled } from "./newsletterConfig";
import { getProductionPublicationRun, recordProductionPublicationRun, registerNewsletterPublication } from "./newsletterProduction";

export async function scheduleProductionNewsletter(articleId: string, reschedule = false) {
  if (!isProductionNewsletterEnabled()) return;
  await registerNewsletterPublication(articleId);
  const job = await getProductionPublicationRun(articleId);
  if (!job || job.completed_at) return;
  if (job.run_id && !reschedule) {
    const status = await getRun(job.run_id).status.catch(() => "failed");
    if (!["completed", "cancelled", "failed"].includes(status)) return;
  }
  const run = await start(publishArticleNewsletter, [articleId]);
  await recordProductionPublicationRun(articleId, run.runId);
}

export async function scheduleNewsletterAfterSave(articleId: string) {
  try { await scheduleProductionNewsletter(articleId, true); }
  catch { console.error("La programmation de la newsletter sera retentée par la tâche de récupération."); }
}
