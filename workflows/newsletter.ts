import { sleep } from "workflow";

export async function publishArticleNewsletter(articleId: string) {
  "use workflow";
  while (true) {
    const plan = await prepare(articleId);
    if (plan.stop) return;
    if (plan.waitUntil) {
      if (Date.parse(plan.waitUntil) > Date.now()) await sleep(new Date(plan.waitUntil));
      continue;
    }
    break;
  }
  while (true) {
    if (await deliver(articleId)) continue;
    if (await finish(articleId)) return;
    const plan = await prepare(articleId);
    if (plan.stop) return;
    if (plan.waitUntil && Date.parse(plan.waitUntil) > Date.now()) {
      await sleep(new Date(plan.waitUntil));
      continue;
    }
    await sleep("2m");
  }
}

async function prepare(articleId: string) {
  "use step";
  const { prepareProductionPublication } = await import("@/app/lib/newsletterProduction");
  return prepareProductionPublication(articleId);
}

async function deliver(articleId: string) {
  "use step";
  const { sendNextProductionNewsletterMail } = await import("@/app/lib/newsletterProduction");
  return sendNextProductionNewsletterMail(articleId);
}

async function finish(articleId: string) {
  "use step";
  const { finishProductionPublication } = await import("@/app/lib/newsletterProduction");
  return finishProductionPublication(articleId);
}
