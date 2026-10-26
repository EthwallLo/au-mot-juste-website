import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";
import { NextRequest } from "next/server.js";

const require = createRequire(import.meta.url);

function loadModule(file, dependencies, env = {}, globals = {}) {
  const testModule = { exports: {} };
  const source = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, {
    module: testModule, exports: testModule.exports,
    require: (name) => name in dependencies ? dependencies[name] : name === "./seo" ? { SITE_URL: "https://aumotjuste-correction.fr" } : require(name),
    process: { env, cwd: () => process.cwd() },
    Buffer, URL, Date, setTimeout, console, ...globals,
  }, { filename: file });
  return testModule.exports;
}

async function localNewsletter(t) {
  const directory = await realpath(await mkdtemp(path.join(tmpdir(), "amj-newsletter-test-")));
  t.after(async () => {
    const target = await realpath(directory);
    assert.equal(target, directory);
    assert.ok(path.basename(target).startsWith("amj-newsletter-test-"));
    await rm(target, { recursive: true, force: true });
  });
  const env = { NEWSLETTER_LOCAL_ENABLED: "true", NEWSLETTER_LOCAL_DATA_DIR: directory };
  let now = Date.now();
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const config = loadModule("app/lib/newsletterConfig.ts", {}, env);
  const email = loadModule("app/lib/newsletterEmail.ts", {
    "@/app/components/markdownContent": loadModule("app/components/markdownContent.tsx", {}),
  });
  const newsletter = loadModule("app/lib/newsletterLocal.ts", {
    "server-only": {},
    "@/app/lib/newsletterConfig": config,
    "@/app/lib/newsletterEmail": email,
  }, env, { Date: Clock });
  return { newsletter, config, env, email, now: () => now, advance: (milliseconds) => { now += milliseconds; } };
}

function actionToken(message) {
  return new URL(message.action_url).searchParams.get("token");
}

test("la newsletter locale exige une confirmation et permet de se désinscrire", async (t) => {
  const { newsletter, advance, now } = await localNewsletter(t);
  await assert.rejects(() => newsletter.subscribeToLocalNewsletter("invalide", true, "http://localhost:3000"), newsletter.NewsletterInputError);
  await assert.rejects(() => newsletter.subscribeToLocalNewsletter("lectrice@example.test", false, "http://localhost:3000"), newsletter.NewsletterInputError);
  await assert.rejects(() => newsletter.subscribeToLocalNewsletter("lectrice@example.test", true, "https://example.com"), newsletter.NewsletterInputError);
  await newsletter.subscribeToLocalNewsletter("  Lectrice@Example.test  ", true, "http://localhost:3000");
  await newsletter.subscribeToLocalNewsletter("lectrice@example.test", true, "http://localhost:3000");
  let snapshot = await newsletter.getLocalNewsletterSnapshot();
  assert.equal(snapshot.subscribers.length, 1);
  assert.equal(snapshot.subscribers[0].email, "lectrice@example.test");
  assert.equal(snapshot.subscribers[0].status, "pending");
  assert.equal(snapshot.messages.length, 1);
  assert.ok(!("secret" in snapshot));
  const confirmation = actionToken(snapshot.messages[0]);
  await assert.rejects(() => newsletter.confirmLocalNewsletter(confirmation + "x"), newsletter.NewsletterInputError);
  await assert.rejects(() => newsletter.unsubscribeLocalNewsletter(confirmation), newsletter.NewsletterInputError);
  await newsletter.confirmLocalNewsletter(confirmation);
  await newsletter.confirmLocalNewsletter(confirmation);
  assert.equal((await newsletter.getLocalNewsletterSnapshot()).subscribers[0].status, "active");
  const example = loadModule("app/lib/newsletterExample.ts", {}).NEWSLETTER_EXAMPLE;
  const post = { ...example, status: "published", published_at: new Date(now()).toISOString() };
  assert.equal(await newsletter.simulateLocalArticleDelivery(post), 1);
  assert.equal(await newsletter.simulateLocalArticleDelivery(post), 0);
  snapshot = await newsletter.getLocalNewsletterSnapshot();
  const unsubscribe = actionToken(snapshot.messages[0]);
  await newsletter.unsubscribeLocalNewsletter(unsubscribe);
  await newsletter.unsubscribeLocalNewsletter(unsubscribe);
  assert.equal((await newsletter.getLocalNewsletterSnapshot()).subscribers[0].status, "unsubscribed");
  await assert.rejects(() => newsletter.confirmLocalNewsletter(confirmation), newsletter.NewsletterInputError);
  advance(1000);
  await newsletter.subscribeToLocalNewsletter("lectrice@example.test", true, "http://localhost:3000");
  await assert.rejects(() => newsletter.confirmLocalNewsletter(confirmation), newsletter.NewsletterInputError);
  snapshot = await newsletter.getLocalNewsletterSnapshot();
  await newsletter.confirmLocalNewsletter(actionToken(snapshot.messages[0]));
  assert.equal((await newsletter.getLocalNewsletterSnapshot()).subscribers[0].status, "active");
});

test("la boîte de test actualise les en-têtes et les confirmations sans renouveler les liens", async (t) => {
  const { newsletter, env, advance } = await localNewsletter(t);
  await newsletter.subscribeToLocalNewsletter("lectrice@example.test", true, "http://localhost:3000");
  const file = path.join(env.NEWSLETTER_LOCAL_DATA_DIR, "state.json");
  const state = JSON.parse(await readFile(file, "utf8"));
  const original = { ...state.messages[0] };
  state.messages[0].subject = "Ancienne confirmation";
  state.messages[0].html = "<h1>Des mots justes dans votre boîte mail.</h1>";
  state.messages[0].text = "Des mots justes dans votre boîte mail.";
  const articleBody = "<p>Article conservé : LE CARNET DE LORENA</p>";
  const article = { ...original, id: "article-archive", kind: "article", html: `<p>Au mot juste</p><p style="font-size:12px">LE CARNET DE LORENA</p>${articleBody}`, text: "Article conservé" };
  state.messages.push(article);
  await writeFile(file, JSON.stringify(state));
  const before = await readFile(file, "utf8");

  const snapshot = await newsletter.getLocalNewsletterSnapshot();
  const confirmation = snapshot.messages.find((message) => message.kind === "confirmation");
  assert.ok(!confirmation.html.includes("Des mots justes dans votre boîte mail"));
  assert.ok(!confirmation.text.includes("Des mots justes dans votre boîte mail"));
  assert.ok(confirmation.html.includes("Merci pour votre intérêt,"));
  assert.ok(confirmation.html.includes("Pour confirmer votre inscription et recevoir mes prochains articles par e-mail, cliquez sur le bouton ci-dessous :"));
  assert.ok(confirmation.html.includes(">Confirmez votre inscription au blog</h1>"));
  assert.ok(!confirmation.html.includes("LE CARNET DE LORENA"));
  assert.ok(confirmation.text.startsWith("Au mot juste\n\nConfirmez votre inscription au blog\n\nMerci pour votre intérêt,"));
  assert.ok(confirmation.text.endsWith("À bientôt !\nLorena - Au mot juste"));
  for (const key of ["id", "to", "created_at", "action_url"]) assert.equal(confirmation[key], original[key]);
  assert.equal(JSON.stringify(snapshot.messages.find((message) => message.kind === "article")), JSON.stringify({ ...article, html: `<p>Au mot juste</p>${articleBody}` }));
  assert.equal(await readFile(file, "utf8"), before);
  advance(25 * 60 * 60 * 1000);
  await assert.rejects(() => newsletter.confirmLocalNewsletter(actionToken(confirmation)), newsletter.NewsletterInputError);
});

test("un lien expiré peut être remplacé par une nouvelle demande d’inscription", async (t) => {
  const { newsletter, advance } = await localNewsletter(t);
  await newsletter.subscribeToLocalNewsletter("lectrice@example.test", true, "http://localhost:3000");
  const expired = actionToken((await newsletter.getLocalNewsletterSnapshot()).messages[0]);
  advance(25 * 60 * 60 * 1000);
  await assert.rejects(() => newsletter.confirmLocalNewsletter(expired), newsletter.NewsletterInputError);
  await newsletter.subscribeToLocalNewsletter("lectrice@example.test", true, "http://localhost:3000");
  const snapshot = await newsletter.getLocalNewsletterSnapshot();
  assert.equal(snapshot.messages.length, 2);
  await newsletter.confirmLocalNewsletter(actionToken(snapshot.messages[0]));
  assert.equal((await newsletter.getLocalNewsletterSnapshot()).subscribers[0].status, "active");
});

test("une publication déclenche un seul mail complet, à sa sortie, aux abonnés confirmés", async (t) => {
  const { newsletter, now, advance } = await localNewsletter(t);
  const example = loadModule("app/lib/newsletterExample.ts", {}).NEWSLETTER_EXAMPLE;
  const old = { ...example, id: "ancien", status: "published", published_at: new Date(now() - 86400000).toISOString() };
  await newsletter.processLocalNewsletterPublications([old]);
  await newsletter.subscribeToLocalNewsletter("active@example.test", true, "http://localhost:3000");
  await newsletter.confirmLocalNewsletter(actionToken((await newsletter.getLocalNewsletterSnapshot()).messages[0]));
  await newsletter.subscribeToLocalNewsletter("pending@example.test", true, "http://localhost:3000");
  const upcoming = { ...example, id: "planifie", status: "scheduled", published_at: new Date(now() + 60000).toISOString() };
  assert.equal(await newsletter.processLocalNewsletterPublications([old, upcoming]), 0);
  await assert.rejects(() => newsletter.simulateLocalArticleDelivery(upcoming), newsletter.NewsletterInputError);
  advance(60000);
  const published = { ...upcoming, status: "published" };
  assert.equal(await newsletter.processLocalNewsletterPublications([old, published]), 1);
  assert.equal(await newsletter.processLocalNewsletterPublications([old, published]), 0);
  assert.equal(await newsletter.processLocalNewsletterPublications([old, { ...published, content: "Une correction après publication." }]), 0);
  let snapshot = await newsletter.getLocalNewsletterSnapshot();
  const articles = snapshot.messages.filter((message) => message.kind === "article");
  assert.equal(articles.length, 1);
  assert.equal(articles[0].to, "active@example.test");
  assert.ok(articles[0].html.includes("laisser reposer son texte"));
  assert.ok(articles[0].text.includes(example.content));
  assert.ok(articles[0].html.includes("Me désinscrire"));
  await newsletter.unsubscribeLocalNewsletter(actionToken(articles[0]));
  advance(1000);
  assert.equal(await newsletter.processLocalNewsletterPublications([old, published, { ...published, id: "suivant", published_at: new Date(now()).toISOString() }]), 0);
  snapshot = await newsletter.getLocalNewsletterSnapshot();
  assert.equal(snapshot.messages.filter((message) => message.kind === "article").length, 1);
});

test("les demandes concurrentes ne perdent pas d’inscription et ne dupliquent pas les confirmations", async (t) => {
  const { newsletter } = await localNewsletter(t);
  await Promise.all(Array.from({ length: 8 }, (_, index) => newsletter.subscribeToLocalNewsletter(`lectrice${index % 2}@example.test`, true, "http://localhost:3000")));
  const snapshot = await newsletter.getLocalNewsletterSnapshot();
  assert.equal(snapshot.subscribers.length, 2);
  assert.equal(snapshot.messages.length, 2);
});

test("le prototype est désactivé sur Vercel et les données des abonnés restent privées", async (t) => {
  const { newsletter, env } = await localNewsletter(t);
  const config = loadModule("app/lib/newsletterConfig.ts", {}, { ...env, VERCEL: "1" });
  assert.equal(config.isLocalNewsletterEnabled(), false);
  assert.equal(config.isLocalNewsletterOrigin("https://example.com"), false);
  assert.equal(config.isLocalNewsletterOrigin("http://localhost.example.com"), false);
  assert.equal(config.isLocalNewsletterOrigin("http://127.0.0.1:3000"), true);
  const request = loadModule("app/lib/newsletterRequest.ts", { "@/app/lib/newsletterConfig": loadModule("app/lib/newsletterConfig.ts", {}, env) });
  const localAlias = new NextRequest("http://localhost:3000/api/newsletter/subscribe", { headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" } });
  assert.equal(request.isLocalNewsletterRequest(localAlias), true);
  assert.equal(request.getLocalNewsletterRequestOrigin(localAlias), "http://127.0.0.1:3000");
  assert.equal(request.isLocalNewsletterRequest(new NextRequest("http://localhost:3000/api/newsletter/subscribe", { headers: { host: "localhost:3000", origin: "https://example.com" } })), false);
  const route = loadModule("app/api/admin/newsletter/route.ts", {
    "@/app/lib/adminSession": { isAdminRequestAuthenticated: () => false },
    "@/app/lib/blog": { getAllBlogPosts: async () => [] },
    "@/app/lib/newsletterLocal": newsletter,
    "@/app/lib/newsletterRequest": request,
    "@/app/lib/newsletterWorker": { syncLocalNewsletter: async () => 0 },
    "@/app/lib/newsletterExample": loadModule("app/lib/newsletterExample.ts", {}),
    "@/app/lib/newsletterProduction": {},
    "@/app/lib/newsletterSchedule": {},
  });
  assert.equal((await route.GET(new NextRequest("http://localhost:3000/api/admin/newsletter"))).status, 401);
  assert.equal((await route.GET(new NextRequest("https://example.com/api/admin/newsletter"))).status, 404);
});

test("le mail échappe le HTML et conserve les listes, le gras, les citations et le texte intégral", async (t) => {
  const { email } = await localNewsletter(t);
  const example = loadModule("app/lib/newsletterExample.ts", {}).NEWSLETTER_EXAMPLE;
  const result = email.renderArticleEmail({ ...example, title: '<script>alert("test")</script>', content: example.content + "\n\n<img src=x onerror=alert(1)>" }, "http://localhost:3000", "http://localhost:3000/newsletter/desinscription?token=exemple");
  assert.ok(!result.html.includes("<script>"));
  assert.ok(!result.html.includes("<img src=x"));
  assert.ok(result.html.includes("<strong"));
  assert.ok(result.html.includes("<ul"));
  assert.ok(result.html.includes("<blockquote"));
  assert.ok(result.html.includes(">Au mot juste</p>"));
  assert.ok(!result.html.includes("LE CARNET DE LORENA"));
  assert.ok(result.text.includes(example.content));
});
