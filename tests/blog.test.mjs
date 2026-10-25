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

function loadModule(file, dependencies, env = {}) {
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
  }, { filename: file });

  return testModule.exports;
}

function loadBlog(db, env = { DATABASE_URL: "postgresql://test:test@example.invalid/test" }) {
  return loadModule("app/lib/blog.ts", {
    "server-only": {},
    "next/cache": { unstable_cache: (callback) => callback },
    "@neondatabase/serverless": {
      neon: () => ({ query: async (statement, parameters) => (await db.query(statement, parameters)).rows }),
    },
  }, env);
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
