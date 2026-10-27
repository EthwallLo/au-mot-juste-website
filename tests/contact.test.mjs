import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";
import { PGlite } from "@electric-sql/pglite";
import nodemailer from "nodemailer";
import { getDatabaseMode } from "../database/config.mjs";

const require = createRequire(import.meta.url);
function load(file, dependencies = {}, env = {}, extra = {}) {
  const mod = { exports: {} };
  const source = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, {
    module: mod, exports: mod.exports,
    require: name => name in dependencies ? dependencies[name] : require(name),
    process: { env }, Request, Response, URL, TextDecoder, Uint8Array, console,
    ...extra,
  }, { filename: file });
  return mod.exports;
}

const contact = load("app/lib/contact.ts");
const origin = "https://aumotjuste-correction.fr";
const payload = {
  name: "Élodie D’Almeida", email: "elodie+contact@example.test", phone: "+33 6 12 34 56 78",
  subject: "Devis pour un mémoire", message: "Bonjour,\r\nPourriez-vous relire mon mémoire ?\r\nMerci !",
  website: "",
};
const environment = {
  VERCEL: "1", VERCEL_ENV: "production", DATABASE_URL: "postgresql://test.invalid/contact",
  EMAIL_USER: "site@example.test", EMAIL_PASS: "test-password-never-used-outside-tests",
};
function request(body = payload, headers = {}, url = `${origin}/api/contact`) {
  return new Request(url, { method: "POST", headers: { "content-type": "application/json", origin, "x-vercel-forwarded-for": "192.0.2.1", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });
}

test("le contact accepte les textes français et les téléphones avec espaces", async () => {
  const result = await contact.readContactRequest(request());
  assert.equal(result.name, payload.name);
  assert.equal(result.phone, "+33612345678");
  assert.equal(result.message, payload.message.replaceAll("\r\n", "\n"));
  const minimal = contact.validateContactPayload({ email: "reader@example.test", message: "Bonjour !" });
  assert.equal(minimal.name, "");
  assert.equal(minimal.phone, "");
  assert.equal(minimal.subject, "");
});

test("les téléphones français exigent dix chiffres, y compris avec un indicatif", () => {
  const valid = [
    "", "   ", "0769358103", "07 69 35 81 03", "01 23 45 67 89",
    "0 7 6 9 3 5 8 1 0 3", "07\u00a069\u00a035\u00a081\u00a003",
    "+33769358103", "+33 7 69 35 81 03", "0033 7 69 35 81 03",
    "+44 20 7946 0958", "+1 650 253 0000", "+262 692 12 34 56",
  ];
  const invalid = [
    "076935810333333", "07 69 35 81 03 33 33 3", "07693581033", "076935810",
    "+337693581033333", "+33 7 69 35 81 03 33", "+33 07 69 35 81 03",
    "+33 7 69 35 81 0", "0033 7 69 35 81 03 33", "0000000000",
    "1234567890", "0769358103abc", "+0123456789", "+1234567890123456",
  ];
  for (const phone of valid) {
    assert.equal(contact.isValidContactPhone(phone), true, phone);
    assert.ok(contact.validateContactPayload({ ...payload, phone }));
  }
  for (const phone of invalid) {
    assert.equal(contact.isValidContactPhone(phone), false, phone);
    assert.throws(() => contact.validateContactPayload({ ...payload, phone }), error => error.message === contact.CONTACT_PHONE_ERROR_MESSAGE);
  }
});

test("le serveur refuse les champs invalides et les injections d’en-têtes", async t => {
  const invalid = [
    null, [], "texte", { ...payload, email: "" }, { ...payload, message: " \n " },
    { ...payload, email: "pas-un-mail" }, { ...payload, email: "a@example.test,b@example.test" },
    { ...payload, email: "a@example.test\r\nBcc: attacker@example.test" },
    { ...payload, email: ".a@example.test" }, { ...payload, email: "a..b@example.test" },
    { ...payload, name: "Nom\r\nBcc: attacker@example.test" },
    { ...payload, subject: "Devis\nBcc: attacker@example.test" },
    { ...payload, phone: "06 12 34" }, { ...payload, message: "Bonjour\u0000" },
    { ...payload, email: [payload.email] }, { ...payload, name: { address: "evil@example.test" } },
    { ...payload, subject: null }, { ...payload, website: true },
  ];
  for (const [index, body] of invalid.entries()) {
    await t.test(`demande invalide ${index + 1}`, async () => {
      await assert.rejects(() => contact.readContactRequest(request(body)), error => error instanceof contact.ContactInputError && error.status === 400);
    });
  }
  for (const [field, limit] of Object.entries(contact.CONTACT_FIELD_LIMITS)) {
    assert.throws(() => contact.validateContactPayload({ ...payload, [field]: "a".repeat(limit + 1) }), contact.ContactInputError);
  }
});

test("le corps JSON est borné avant décodage, même sans longueur fiable", async () => {
  await assert.rejects(() => contact.readContactRequest(request("{}", { "content-type": "text/plain" })), error => error.status === 415);
  await assert.rejects(() => contact.readContactRequest(request("{invalide")), error => error.status === 400);
  await assert.rejects(() => contact.readContactRequest(request("{}", { "content-length": "999999" })), error => error.status === 413);
  // Every character is under the field limit; the transport must count actual bytes.
  for (const declaredLength of [undefined, "2"]) {
    const headers = new Headers({ "content-type": "application/json" });
    if (declaredLength) headers.set("content-length", declaredLength);
    let cancelled = false;
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"message":"'));
        controller.enqueue(new TextEncoder().encode("é".repeat(contact.CONTACT_MAX_BODY_BYTES / 2 + 1)));
      },
      cancel() { cancelled = true; },
    });
    const oversized = new Request(`${origin}/api/contact`, { method: "POST", headers, body: stream, duplex: "half" });
    await assert.rejects(() => contact.readContactRequest(oversized), error => error.status === 413);
    assert.equal(cancelled, true);
  }
});

test("les envois provenant d’un autre site sont refusés", () => {
  contact.assertContactOrigin(request());
  assert.throws(() => contact.assertContactOrigin(request(payload, { origin: "https://attacker.invalid" })), error => error.status === 403);
  assert.throws(() => contact.assertContactOrigin(request(payload, { origin: "null" })), error => error.status === 403);
  assert.throws(() => contact.assertContactOrigin(request(payload, { "sec-fetch-site": "cross-site" })), error => error.status === 403);
  const missing = request(); missing.headers.delete("origin");
  assert.throws(() => contact.assertContactOrigin(missing), error => error.status === 403);
  contact.assertContactOrigin(request(payload, { origin: "http://127.0.0.1:3108", host: "127.0.0.1:3108" }, "http://localhost:3108/api/contact"), true);
});

function routeHarness({ allowed = true, failure, limiterFailure, env = environment } = {}) {
  const sent = [], transports = [], logs = [];
  let rateChecks = 0;
  const route = load("app/api/contact/route.ts", {
    "@/app/lib/contact": contact,
    "@/app/lib/contactRateLimit": {
      CONTACT_RATE_WINDOW_SECONDS: 3600,
      allowContactRequest: async () => { rateChecks++; if (limiterFailure) throw limiterFailure; return allowed; },
    },
    nodemailer: { createTransport: options => {
      transports.push(options);
      return { sendMail: async mail => { if (failure) throw failure; sent.push(mail); } };
    } },
  }, env, { console: { error: (...args) => logs.push(args) } });
  return { route, sent, transports, logs, rateChecks: () => rateChecks };
}

test("le contact n’envoie aucun mail pour une requête invalide ou un robot", async () => {
  const { route, sent, transports, rateChecks } = routeHarness();
  assert.equal((await route.POST(request({ ...payload, email: "invalide" }))).status, 400);
  assert.equal((await route.POST(request(payload, { origin: "https://attacker.invalid" }))).status, 403);
  assert.equal((await route.POST(request("{}", { "content-type": "text/plain" }))).status, 415);
  const honey = await route.POST(request({ website: "https://spam.invalid" }));
  assert.equal(honey.status, 200);
  assert.equal((await honey.json()).message, contact.CONTACT_SUCCESS_MESSAGE);
  assert.equal(sent.length, 0);
  assert.equal(transports.length, 0);
  assert.equal(rateChecks(), 0);
});

test("un numéro français trop long ne déclenche ni compteur ni envoi", async () => {
  const { route, sent, transports, rateChecks } = routeHarness();
  for (const phone of ["076935810333333", "+337693581033333"]) {
    const response = await route.POST(request({ ...payload, phone }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).message, contact.CONTACT_PHONE_ERROR_MESSAGE);
  }
  assert.equal(rateChecks(), 0);
  assert.equal(transports.length, 0);
  assert.equal(sent.length, 0);
});

test("le destinataire reste fixe et répondre au mail contacte le visiteur", async () => {
  const { route, sent, transports } = routeHarness();
  const response = await route.POST(request({ ...payload, to: "attacker@example.test", from: "forged@example.test", bcc: "attacker@example.test", html: "<script>alert(1)</script>" }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(sent.length, 1);
  const mail = sent[0];
  assert.equal(mail.to, environment.EMAIL_USER);
  assert.equal(mail.from.address, environment.EMAIL_USER);
  assert.equal(mail.replyTo.address, payload.email);
  assert.equal(mail.replyTo.name, payload.name);
  assert.equal(mail.bcc, undefined);
  assert.equal(mail.html, undefined);
  assert.equal(transports[0].disableFileAccess, true);
  assert.equal(transports[0].disableUrlAccess, true);
  // Compose an actual MIME message in memory: no SMTP and no external recipient.
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
  const composed = (await transport.sendMail(mail)).message.toString();
  assert.match(composed, /Reply-To:/);
  assert.ok(composed.includes(payload.email));
  assert.ok(!composed.includes("attacker@example.test"));
});

test("la limite et les pannes bloquent l’envoi sans exposer les secrets", async () => {
  const limited = routeHarness({ allowed: false });
  const response = await limited.route.POST(request());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "3600");
  assert.equal(limited.transports.length, 0);
  for (const options of [
    { failure: new Error(`SMTP ${environment.EMAIL_PASS} ${payload.email}`) },
    { limiterFailure: new Error(environment.DATABASE_URL) },
    { env: { ...environment, EMAIL_PASS: "" } },
  ]) {
    const failed = routeHarness(options);
    const result = await failed.route.POST(request());
    assert.equal(result.status, 503);
    const output = await result.text() + JSON.stringify(failed.logs);
    for (const secret of [environment.EMAIL_PASS, environment.DATABASE_URL, payload.email]) assert.ok(!output.includes(secret));
    assert.equal(failed.sent.length, 0);
  }
});

test("la limite en base résiste aux envois concurrents et aux redémarrages", async t => {
  const db = new PGlite();
  t.after(() => db.close());
  const dependencies = {
    "server-only": {},
    "@/database/config.mjs": { getDatabaseMode },
    "@neondatabase/serverless": { neon: () => ({ query: async (statement, parameters) => (await db.query(statement, parameters)).rows }) },
  };
  const limiter = load("app/lib/contactRateLimit.ts", dependencies, environment);
  const allowed = await Promise.all(Array.from({ length: 15 }, () => limiter.allowContactRequest(request(), environment.EMAIL_PASS)));
  assert.equal(allowed.filter(Boolean).length, 5);
  const restarted = load("app/lib/contactRateLimit.ts", dependencies, environment);
  assert.equal(await restarted.allowContactRequest(request(), environment.EMAIL_PASS), false);
  assert.equal(await restarted.allowContactRequest(request(payload, { "x-vercel-forwarded-for": "192.0.2.2", "x-forwarded-for": "192.0.2.1" }), environment.EMAIL_PASS), true);
  const rows = (await db.query("SELECT * FROM public.contact_rate_limits")).rows;
  assert.equal(rows.length, 2);
  for (const row of rows) assert.match(row.bucket, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(rows).includes("192.0.2."));
  assert.ok(!JSON.stringify(rows).includes(environment.EMAIL_PASS));
  await db.query("UPDATE public.contact_rate_limits SET expires_at = now() - interval '1 second'");
  assert.equal(await restarted.allowContactRequest(request(), environment.EMAIL_PASS), true);
  assert.equal((await db.query("SELECT count FROM public.contact_rate_limits")).rows[0].count, 1);
  await assert.rejects(() => restarted.allowContactRequest(request(payload, { "x-vercel-forwarded-for": "invalide" }), environment.EMAIL_PASS));
});

test("en local, les en-têtes falsifiés et l’URL de production ne contournent pas la limite", async t => {
  const db = new PGlite();
  t.after(() => db.close());
  let remoteCalls = 0;
  const limiter = load("app/lib/contactRateLimit.ts", {
    "server-only": {}, "@/database/config.mjs": { getDatabaseMode },
    "@/database/local.mjs": { queryLocalDatabase: async (statement, parameters) => (await db.query(statement, parameters)).rows },
    "@neondatabase/serverless": { neon: () => { remoteCalls++; throw new Error("Forbidden remote access"); } },
  }, { EMAIL_PASS: environment.EMAIL_PASS, DATABASE_URL: environment.DATABASE_URL });
  const results = [];
  for (let index = 0; index < 6; index++) {
    results.push(await limiter.allowContactRequest(request(payload, { "x-vercel-forwarded-for": `192.0.2.${index}` }), environment.EMAIL_PASS));
  }
  assert.equal(results.filter(Boolean).length, 5);
  assert.equal(remoteCalls, 0);
});
