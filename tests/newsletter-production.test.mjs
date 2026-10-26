import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";
import { PGlite } from "@electric-sql/pglite";
import { NextRequest } from "next/server.js";

const require = createRequire(import.meta.url);
function load(file, dependencies = {}, env = {}) {
  const mod = { exports: {} };
  const source = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, { module: mod, exports: mod.exports,
    require: name => name in dependencies ? dependencies[name] : require(name),
    process: { env, cwd: () => process.cwd() }, Date, URL, Buffer, console,
  }, { filename: file });
  return mod.exports;
}

const environment = { VERCEL: "1", VERCEL_ENV: "production", NEWSLETTER_ENABLED: "true", NEWSLETTER_SECRET: "test-secret-never-used-outside-tests", DATABASE_URL: "postgresql://test.invalid/test" };
function config(env = environment) { return load("app/lib/newsletterConfig.ts", { "./seo": { SITE_URL: "https://aumotjuste-correction.fr" } }, env); }

test("la newsletter réelle est limitée à la production et aux requêtes du site", () => {
  for (const env of [{ ...environment, VERCEL_ENV: "preview" }, { ...environment, VERCEL: "0" }, { ...environment, NEWSLETTER_ENABLED: "false" }]) {
    assert.equal(config(env).isProductionNewsletterEnabled(), false);
  }
  const request = load("app/lib/newsletterRequest.ts", { "@/app/lib/newsletterConfig": config() });
  assert.equal(request.isProductionNewsletterRequest(new NextRequest("https://aumotjuste-correction.fr/api/newsletter/subscribe", { headers: { origin: "https://aumotjuste-correction.fr" } })), true);
  assert.equal(request.isProductionNewsletterRequest(new NextRequest("https://aumotjuste-correction.fr/api/newsletter/subscribe", { headers: { origin: "https://attacker.invalid" } })), false);
  assert.equal(request.isProductionNewsletterRequest(new NextRequest("https://attacker.invalid/api/newsletter/subscribe")), false);
  assert.equal(request.isProductionNewsletterRequest(new NextRequest("http://localhost:3000/api/newsletter/subscribe")), false);
});

test("abonnements et envois de production sur PostgreSQL, sans SMTP réel", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(readFileSync(new URL("../database/schema.sql", import.meta.url), "utf8"));
  const sent = [];
  let failSmtp = false;
  class NewsletterInputError extends Error {}
  const sql = {
    query: async (statement, parameters) => (await db.query(statement, parameters)).rows,
    transaction: async (operations) => Promise.all(operations),
  };
  const template = load("app/lib/newsletterEmail.ts", { "@/app/components/markdownContent": load("app/components/markdownContent.tsx") });
  const service = load("app/lib/newsletterProduction.ts", {
    "server-only": {}, "@neondatabase/serverless": { neon: () => sql },
    "./newsletterConfig": config(), "./newsletterEmail": template, "./newsletterLocal": { NewsletterInputError },
    "./newsletterSmtp": { sendProductionNewsletterMail: async (mail) => { if (failSmtp) throw Object.assign(new Error("SMTP offline"), { retryable: true }); sent.push(mail); return "test-message-id"; } },
  }, environment);
  const token = message => new URL(message.action_url).searchParams.get("token");
  const snapshot = () => service.getProductionNewsletterSnapshot();
  const createArticle = async (status = "published", future = false) => {
    const [article] = (await db.query(`INSERT INTO public.articles(title,slug,content,status,published_at)
      VALUES ('Un article',gen_random_uuid()::text,'Contenu intégral', $1,now()+$2::interval) RETURNING *`, [status, future ? "1 hour" : "0 seconds"])).rows;
    return article;
  };
  let confirmation;
  let firstArticle;

  await t.test("la confirmation est envoyée une fois et ne peut pas être falsifiée", async () => {
    await assert.rejects(() => service.subscribeToProductionNewsletter("invalide", true), NewsletterInputError);
    await assert.rejects(() => service.subscribeToProductionNewsletter("reader@example.test", false), NewsletterInputError);
    await Promise.all(Array.from({ length: 3 }, () => service.subscribeToProductionNewsletter(" Reader@Example.test ", true)));
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, "reader@example.test");
    const state = await snapshot();
    confirmation = state.messages[0];
    assert.equal(state.subscribers[0].status, "pending");
    assert.equal(new URL(confirmation.action_url).origin, "https://aumotjuste-correction.fr");
    await assert.rejects(() => service.confirmProductionNewsletter(token(confirmation) + "x"), NewsletterInputError);
    await assert.rejects(() => service.unsubscribeProductionNewsletter(token(confirmation)), NewsletterInputError);
    await service.confirmProductionNewsletter(token(confirmation));
    await service.confirmProductionNewsletter(token(confirmation));
    assert.equal((await snapshot()).subscribers[0].status, "active");
  });

  await t.test("la limitation des inscriptions ne conserve pas l’adresse IP brute", async () => {
    for (let count = 0; count < 5; count++) assert.equal(await service.allowProductionNewsletterSignup("192.0.2.1"), true);
    assert.equal(await service.allowProductionNewsletterSignup("192.0.2.1"), false);
    const { rows } = await db.query("SELECT * FROM public.newsletter_rate_limits");
    assert.ok(!JSON.stringify(rows).includes("192.0.2.1"));
  });

  await t.test("les anciens articles ne sont pas envoyés et une planification attend son échéance", async () => {
    const old = await createArticle();
    assert.equal((await service.prepareProductionPublication(old.id)).stop, true);
    firstArticle = await createArticle("scheduled", true);
    await service.registerNewsletterPublication(firstArticle.id);
    assert.ok((await service.prepareProductionPublication(firstArticle.id)).waitUntil);
    assert.equal(await service.sendNextProductionNewsletterMail(firstArticle.id), false);
    assert.equal(sent.filter(mail => mail.kind === "article").length, 0);
    await db.query("UPDATE public.articles SET published_at=now() WHERE id=$1", [firstArticle.id]);
  });

  await t.test("deux exécutions concurrentes envoient une seule copie aux abonnés confirmés", async () => {
    await service.subscribeToProductionNewsletter("pending@example.test", true);
    await service.prepareProductionPublication(firstArticle.id);
    await service.prepareProductionPublication(firstArticle.id);
    await Promise.all([service.sendNextProductionNewsletterMail(firstArticle.id), service.sendNextProductionNewsletterMail(firstArticle.id)]);
    const articles = sent.filter(mail => mail.kind === "article");
    assert.equal(articles.length, 1);
    assert.equal(articles[0].to, "reader@example.test");
    assert.ok(articles[0].html.includes("Contenu intégral"));
    assert.ok(!articles[0].html.includes("LE CARNET DE LORENA"));
    assert.equal(await service.finishProductionPublication(firstArticle.id), true);
    assert.equal((await service.prepareProductionPublication(firstArticle.id)).stop, true);
  });

  await t.test("un article remis en brouillon ou reporté ne déclenche pas l’envoi", async () => {
    const article = await createArticle();
    await service.registerNewsletterPublication(article.id);
    await service.prepareProductionPublication(article.id);
    await db.query("UPDATE public.articles SET status='draft' WHERE id=$1", [article.id]);
    assert.equal((await service.prepareProductionPublication(article.id)).stop, true);
    assert.equal(await service.sendNextProductionNewsletterMail(article.id), false);
    await db.query("UPDATE public.articles SET status='scheduled',published_at=now()+interval '1 hour' WHERE id=$1", [article.id]);
    assert.ok((await service.prepareProductionPublication(article.id)).waitUntil);
    assert.equal(await service.sendNextProductionNewsletterMail(article.id), false);
  });

  await t.test("un échec SMTP est conservé pour une reprise et un mail envoyé n’est pas répété", async () => {
    const article = await createArticle();
    await service.registerNewsletterPublication(article.id);
    await service.prepareProductionPublication(article.id);
    failSmtp = true;
    await assert.rejects(() => service.sendNextProductionNewsletterMail(article.id));
    assert.equal(await service.sendNextProductionNewsletterMail(article.id), false);
    const { rows } = await db.query("SELECT status FROM public.newsletter_deliveries WHERE article_id=$1", [article.id]);
    assert.equal(rows[0].status, "failed");
    failSmtp = false;
    await db.query("UPDATE public.newsletter_deliveries SET available_at=now() WHERE article_id=$1", [article.id]);
    assert.equal(await service.sendNextProductionNewsletterMail(article.id), true);
    assert.equal(await service.sendNextProductionNewsletterMail(article.id), false);
  });

  await t.test("la désinscription annule les envois en attente et une réinscription invalide les anciens liens", async () => {
    const article = await createArticle();
    await service.registerNewsletterPublication(article.id);
    await service.prepareProductionPublication(article.id);
    const firstDelivery = (await snapshot()).messages.find(message => message.article_id === firstArticle.id) || (await snapshot()).messages.find(message => message.kind === "article" && message.status === "sent");
    await service.unsubscribeProductionNewsletter(token(firstDelivery));
    await service.unsubscribeProductionNewsletter(token(firstDelivery));
    assert.equal(await service.sendNextProductionNewsletterMail(article.id), false);
    await assert.rejects(() => service.confirmProductionNewsletter(token(confirmation)), NewsletterInputError);
    await service.subscribeToProductionNewsletter("reader@example.test", true);
    await assert.rejects(() => service.unsubscribeProductionNewsletter(token(firstDelivery)), NewsletterInputError);
    const newest = (await snapshot()).messages.find(message => message.kind === "confirmation" && message.to === "reader@example.test" && message.status === "sent");
    await service.confirmProductionNewsletter(token(newest));
    assert.equal((await snapshot()).subscribers.find(subscriber => subscriber.email === "reader@example.test").status, "active");
  });

  await t.test("une interruption après la réservation n’entraîne pas un deuxième envoi automatique", async () => {
    const article = await createArticle();
    await service.registerNewsletterPublication(article.id);
    await service.prepareProductionPublication(article.id);
    await db.query("UPDATE public.newsletter_deliveries SET status='sending',locked_at=now()-interval '15 minutes' WHERE article_id=$1", [article.id]);
    const count = sent.length;
    assert.equal(await service.sendNextProductionNewsletterMail(article.id), false);
    assert.equal((await service.prepareProductionPublication(article.id)).stop, true);
    assert.equal(await service.finishProductionPublication(article.id), false);
    assert.equal(sent.length, count);
    assert.ok(!(await service.getPendingProductionPublications()).some(job => job.article_id === article.id));
  });
});

test("le workflow attend la date prévue puis termine la livraison sans serveur local", async () => {
  const at = new Date(Date.now() + 3600000).toISOString();
  const waits = [];
  let prepared = 0, deliveries = 0;
  const workflow = load("workflows/newsletter.ts", {
    workflow: { sleep: async date => waits.push(date) },
    "@/app/lib/newsletterProduction": {
      prepareProductionPublication: async () => prepared++ === 0 ? { waitUntil: at } : {},
      sendNextProductionNewsletterMail: async () => deliveries++ === 0,
      finishProductionPublication: async () => true,
    },
  });
  await workflow.publishArticleNewsletter("test-article");
  assert.equal(waits.length, 1);
  assert.equal(waits[0].toISOString(), at);
  assert.equal(deliveries, 2);
});
