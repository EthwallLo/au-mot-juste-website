import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { PGlite } from "@electric-sql/pglite";
import { getPayloadFromClientToken } from "@vercel/blob/client";
import { NextRequest } from "next/server.js";

const require = createRequire(import.meta.url);

function loadModule(file, dependencies, env = {}, globals = {}) {
  const testModule = { exports: {} };
  const source = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;

  vm.runInNewContext(source, {
    module: testModule,
    exports: testModule.exports,
    require: (name) => name in dependencies ? dependencies[name] : require(name),
    process: { env },
    Date,
    console,
    ...globals,
  }, { filename: file });

  return testModule.exports;
}

function loadBlog(db, env = { DATABASE_URL: "postgresql://test:test@example.invalid/test" }, options = {}) {
  return loadModule("app/lib/blog.ts", {
    "server-only": {},
    "next/cache": { unstable_cache: options.cache ?? ((callback) => callback) },
    "@neondatabase/serverless": {
      neon: () => ({ query: async (statement, parameters) => (await db.query(statement, parameters)).rows }),
    },
  }, env, options.Date ? { Date: options.Date } : {});
}

const draft = {
  title: "Un article d’essai",
  slug: "article-essai",
  content: "Un texte à corriger.",
  status: "draft",
};

test("publication des articles sur PostgreSQL", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  const schema = readFileSync(new URL("../database/schema.sql", import.meta.url), "utf8");
  const statements = schema.split(/^-- statement-breakpoint\s*$/m).map((part) => part.trim()).filter(Boolean);

  for (const statement of statements) {
    await db.query(statement);
  }

  const blog = loadBlog(db);
  let article;

  await t.test("un brouillon est conservé dans l’administration et reste privé", async () => {
    article = await blog.createBlogPost(draft);
    assert.equal(article.status, "draft");
    assert.equal(article.published_at, null);
    assert.equal((await blog.getAllBlogPosts()).length, 1);
    assert.equal((await blog.getPublishedBlogPosts()).length, 0);
    assert.equal(await blog.getPublishedBlogPostBySlug(article.slug), null);
  });

  await t.test("un article publié expose le contenu et des dates sérialisables", async () => {
    article = await blog.updateBlogPost(article.id, {
      ...draft,
      status: "published",
      published_at: "2026-10-25T10:00:00.000Z",
    });
    const visible = await blog.getPublishedBlogPosts();
    assert.equal(visible.length, 1);
    assert.equal(visible[0].id, article.id);
    assert.equal(typeof visible[0].updated_at, "string");
    assert.ok(!("content" in visible[0]));
    assert.equal((await blog.getPublishedBlogPostBySlug(article.slug)).content, draft.content);
    assert.equal(article.published_at, "2026-10-25T10:00:00.000Z");
  });

  await t.test("les valeurs saisies ne deviennent jamais du SQL", async () => {
    const title = "L’article'; DROP TABLE public.articles; --";
    article = await blog.updateBlogPost(article.id, { ...draft, title, status: "published" });
    assert.equal(article.title, title);
    assert.equal(await blog.getPublishedBlogPostBySlug("' OR 1=1 --"), null);
    assert.equal((await blog.getAllBlogPosts()).length, 1);
  });

  await t.test("un slug en double et une mauvaise date donnent une erreur lisible", async () => {
    await assert.rejects(() => blog.createBlogPost(draft), blog.BlogInputError);
    await assert.rejects(
      () => blog.createBlogPost({ ...draft, slug: "autre", status: "published", published_at: "pas-une-date" }),
      blog.BlogInputError,
    );
  });

  await t.test("le schéma peut être relancé sans perdre les articles", async () => {
    for (const statement of statements) {
      await db.query(statement);
    }
    assert.equal((await blog.getAllBlogPosts()).length, 1);
  });

  await t.test("changer le slug retire l’ancienne adresse et dépublier masque le texte", async () => {
    const oldSlug = article.slug;
    article = await blog.updateBlogPost(article.id, { ...draft, slug: "nouvelle-adresse", status: "published" });
    assert.equal(await blog.getPublishedBlogPostBySlug(oldSlug), null);
    assert.equal((await blog.getPublishedBlogPostBySlug(article.slug)).id, article.id);
    await blog.updateBlogPost(article.id, { ...draft, slug: article.slug });
    assert.equal((await blog.getPublishedBlogPosts()).length, 0);
    assert.equal(await blog.getPublishedBlogPostBySlug(article.slug), null);
  });

  await t.test("la suppression et les identifiants invalides sont gérés", async () => {
    await blog.deleteBlogPost(article.id);
    assert.equal((await blog.getAllBlogPosts()).length, 0);
    await assert.rejects(() => blog.updateBlogPost(article.id, draft), blog.BlogInputError);
    await assert.rejects(() => blog.deleteBlogPost("identifiant-invalide"), blog.BlogInputError);
  });

  await t.test("la configuration et une table manquantes sont signalées", async () => {
    const unconfigured = loadBlog(db, {});
    await assert.rejects(() => unconfigured.getAllBlogPosts(), unconfigured.BlogConfigError);
    await db.exec("DROP TABLE public.articles");
    await assert.rejects(() => blog.getAllBlogPosts(), blog.BlogConfigError);
  });
});

test("planification des publications", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  const schema = readFileSync(new URL("../database/schema.sql", import.meta.url), "utf8");
  for (const statement of schema.split(/^-- statement-breakpoint\s*$/m).map((part) => part.trim()).filter(Boolean)) {
    await db.query(statement);
  }

  let now = Date.now();
  class Clock extends Date {
    static now() { return now; }
    static [Symbol.hasInstance](value) { return value instanceof Date; }
  }
  const blog = loadBlog(db, undefined, { Date: Clock });
  const publicationTime = now + 60 * 60 * 1000;
  const scheduled = { ...draft, status: "scheduled", published_at: new Date(publicationTime).toISOString() };
  let article;
  let reads = 0;
  const cache = (callback) => {
    const values = new Map();
    return (...args) => {
      const key = JSON.stringify(args);
      if (!values.has(key)) values.set(key, callback(...args));
      return values.get(key);
    };
  };
  const cachedBlog = loadBlog({ query: (...args) => { reads++; return db.query(...args); } }, undefined, { Date: Clock, cache });

  await t.test("une planification exige une date valide dans le futur", async () => {
    for (const published_at of ["", "pas-une-date", new Date(now - 1000).toISOString(), new Date(now).toISOString()]) {
      await assert.rejects(() => blog.createBlogPost({ ...scheduled, published_at }), blog.BlogInputError);
    }
    assert.equal((await blog.getAllBlogPosts()).length, 0);
  });

  await t.test("un article planifié est privé dans la liste et à son adresse", async () => {
    article = await blog.createBlogPost(scheduled);
    assert.equal(article.status, "scheduled");
    assert.equal(article.published_at, scheduled.published_at);
    assert.equal((await cachedBlog.getPublishedBlogPosts()).length, 0);
    assert.equal(await cachedBlog.getPublishedBlogPostBySlug(article.slug), null);
    assert.equal((await blog.getAllBlogPosts())[0].status, "scheduled");
    now = publicationTime - 1;
    assert.equal((await cachedBlog.getPublishedBlogPosts()).length, 0);
    assert.equal(await cachedBlog.getPublishedBlogPostBySlug(article.slug), null);
  });

  await t.test("l’échéance rend l’article public même avec un cache déjà rempli", async () => {
    const previousReads = reads;
    now = publicationTime;
    assert.equal((await cachedBlog.getPublishedBlogPosts())[0].id, article.id);
    assert.equal((await cachedBlog.getPublishedBlogPostBySlug(article.slug)).status, "published");
    assert.equal(reads, previousReads, "Le passage de la date doit fonctionner sans renouveler le cache SQL.");
    assert.equal((await blog.getAllBlogPosts())[0].status, "published");
  });

  await t.test("un statut publié avec une date future ne publie jamais en avance", async () => {
    const post = await blog.createBlogPost({ ...scheduled, slug: "date-future", status: "published", published_at: new Date(now + 3600000).toISOString() });
    assert.equal(post.status, "scheduled");
    assert.equal(await blog.getPublishedBlogPostBySlug(post.slug), null);
    assert.ok(!(await blog.getPublishedBlogPosts()).some((visible) => visible.id === post.id));
  });

  await t.test("une publication peut être reportée, annulée puis publiée immédiatement", async () => {
    let post = await blog.createBlogPost({ ...scheduled, slug: "report-annulation", published_at: new Date(now + 3600000).toISOString() });
    const postponedDate = new Date(now + 7200000).toISOString();
    post = await blog.updateBlogPost(post.id, { ...scheduled, slug: post.slug, published_at: postponedDate });
    assert.equal(post.published_at, postponedDate);
    assert.equal(await blog.getPublishedBlogPostBySlug(post.slug), null);
    post = await blog.updateBlogPost(post.id, { ...draft, slug: post.slug });
    assert.equal(post.status, "draft");
    assert.equal(post.published_at, null);
    now += 10800000;
    assert.equal(await blog.getPublishedBlogPostBySlug(post.slug), null);
    post = await blog.updateBlogPost(post.id, { ...scheduled, slug: post.slug, published_at: new Date(now + 3600000).toISOString() });
    post = await blog.updateBlogPost(post.id, { ...draft, slug: post.slug, status: "published" });
    assert.equal(post.status, "published");
    assert.equal(post.published_at, new Date(now).toISOString());
    assert.equal((await blog.getPublishedBlogPostBySlug(post.slug)).id, post.id);
  });
});

test("la migration ajoute la planification sans perdre les articles existants", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  const statements = readFileSync(new URL("../database/schema.sql", import.meta.url), "utf8")
    .split(/^-- statement-breakpoint\s*$/m).map((part) => part.trim()).filter(Boolean);
  for (const statement of statements.filter((statement) => !statement.startsWith("alter table"))) {
    await db.query(statement.replace("status text not null default 'draft',", "status text not null default 'draft' check (status in ('draft', 'published')),"));
  }
  const blog = loadBlog(db);
  const existing = await blog.createBlogPost(draft);
  for (const statement of statements) await db.query(statement);
  assert.equal((await blog.getAllBlogPosts())[0].id, existing.id);
  assert.equal((await blog.createBlogPost({ ...draft, slug: "planifie-apres-migration", status: "scheduled", published_at: new Date(Date.now() + 86400000).toISOString() })).status, "scheduled");
  await assert.rejects(() => db.query("INSERT INTO public.articles (title, slug, content, status) VALUES ('Sans date', 'sans-date', 'Texte', 'scheduled')"));
});

test("la planification respecte l’heure de Paris en hiver, en été et au changement d’heure", () => {
  const dates = loadModule("app/lib/blogDates.ts", {});
  assert.equal(dates.parisDateTimeInputToIso("2027-01-15T10:00"), "2027-01-15T09:00:00.000Z");
  assert.equal(dates.parisDateTimeInputToIso("2027-07-15T10:00"), "2027-07-15T08:00:00.000Z");
  assert.equal(dates.toDateTimeInput("2027-07-15T08:00:00.000Z"), "2027-07-15T10:00");
  assert.equal(dates.parisDateTimeInputToIso("2027-03-28T02:30"), "");
  assert.equal(dates.parisDateTimeInputToIso("2027-02-30T10:00"), "");
  assert.equal(dates.parisDateTimeInputToIso(""), "");
});

test("les erreurs de connexion ne divulguent pas les paramètres du serveur", async () => {
  const blog = loadBlog({ query: async () => { throw new Error("postgresql://private:password@example.invalid/db"); } });
  await assert.rejects(() => blog.getAllBlogPosts(), (error) => {
    assert.ok(error instanceof blog.BlogDataError);
    assert.ok(!error.message.includes("password"));
    return true;
  });
});

test("les images nécessitent une session et un jeton limité", async (t) => {
  const token = "vercel_blob_rw_teststore_0123456789abcdefghijklmnopqrstuvwxyz";
  const loadRoute = (authenticated, env = { BLOB_READ_WRITE_TOKEN: token }) => loadModule(
    "app/api/admin/images/route.ts",
    {
      "@/app/lib/adminSession": { isAdminRequestAuthenticated: () => authenticated },
      "@/app/lib/blogImageUpload": loadModule("app/lib/blogImageUpload.ts", {}),
    },
    env,
  );
  const request = (pathname = "articles/1234-test.webp") => new NextRequest("http://localhost/api/admin/images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "blob.generate-client-token", payload: { pathname, multipart: false, clientPayload: null } }),
  });

  await t.test("un visiteur anonyme ne reçoit pas de jeton", async () => {
    assert.equal((await loadRoute(false).POST(request())).status, 401);
  });

  await t.test("une configuration manquante et un mauvais chemin sont refusés", async () => {
    assert.equal((await loadRoute(true, {}).POST(request())).status, 500);
    assert.equal((await loadRoute(true).POST(request("../../autre.txt"))).status, 400);
  });

  await t.test("le jeton autorise uniquement les images et limite leur taille", async () => {
    const response = await loadRoute(true).POST(request());
    assert.equal(response.status, 200);
    const data = await response.json();
    const payload = getPayloadFromClientToken(data.clientToken);
    assert.equal(payload.maximumSizeInBytes, 5 * 1024 * 1024);
    assert.ok(payload.allowedContentTypes.includes("image/webp"));
    assert.ok(!payload.allowedContentTypes.includes("text/html"));
    assert.equal(payload.allowOverwrite, false);
    assert.ok(payload.validUntil > Date.now());
    assert.ok(payload.validUntil <= Date.now() + 15 * 60 * 1000);
  });
});
