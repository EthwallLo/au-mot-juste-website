import "server-only";
import { neon } from "@neondatabase/serverless";
import { unstable_cache } from "next/cache";

export const BLOG_CACHE_TAG = "blog-articles";

export type BlogStatus = "draft" | "published";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  cover_image_source: string | null;
  status: BlogStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogPostPreview = Pick<
  BlogPost,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "cover_image_url"
  | "cover_image_source"
  | "published_at"
  | "created_at"
  | "updated_at"
>;

export class BlogConfigError extends Error {}
export class BlogInputError extends Error {}
export class BlogDataError extends Error {}

const PUBLIC_FIELDS =
  "id,title,slug,excerpt,cover_image_url,cover_image_source,published_at,created_at,updated_at";
const ARTICLE_FIELDS =
  "id,title,slug,excerpt,content,cover_image_url,cover_image_source,status,published_at,created_at,updated_at";

type BlogPostMutation = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  cover_image_source: string | null;
  status: BlogStatus;
  published_at: string | null;
};

async function queryArticles<T>(statement: string, parameters: unknown[] = []): Promise<T[]> {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new BlogConfigError(
      "La connexion à Neon manque. Ajoutez DATABASE_URL aux variables d’environnement.",
    );
  }

  try {
    const rows = await neon(databaseUrl).query(statement, parameters);

    return rows.map((row) => {
      const normalized = { ...row };

      for (const field of ["published_at", "created_at", "updated_at"]) {
        if (normalized[field] instanceof Date) {
          normalized[field] = normalized[field].toISOString();
        }
      }

      return normalized as T;
    });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error ? error.code : null;

    if (code === "23505") {
      throw new BlogInputError("Un article utilise déjà cette adresse. Modifiez le slug.");
    }

    if (code === "42P01") {
      throw new BlogConfigError(
        "La table des articles n’existe pas encore. Exécutez npm run db:setup pour la créer dans Neon.",
      );
    }

    if (code === "22P02") {
      throw new BlogInputError("L’identifiant de l’article est invalide.");
    }

    throw new BlogDataError("Impossible d’accéder aux articles. Vérifiez la connexion à Neon.");
  }
}

function getString(
  value: unknown,
  fieldName: string,
  { required = false }: { required?: boolean } = {},
) {
  if (typeof value !== "string") {
    if (required) {
      throw new BlogInputError(`Le champ "${fieldName}" est obligatoire.`);
    }

    return "";
  }

  const trimmedValue = value.trim();

  if (required && !trimmedValue) {
    throw new BlogInputError(`Le champ "${fieldName}" est obligatoire.`);
  }

  return trimmedValue;
}

function optionalString(value: string) {
  return value.length > 0 ? value : null;
}

function getCoverImageUrl(value: string) {
  if (!value) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new BlogInputError("L'URL de l'image est invalide.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new BlogInputError("L'URL de l'image doit commencer par http ou https.");
  }

  return value;
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function sanitizeBlogPostPayload(input: unknown): BlogPostMutation {
  if (!input || typeof input !== "object") {
    throw new BlogInputError("Le contenu de l'article est invalide.");
  }

  const payload = input as Record<string, unknown>;
  const title = getString(payload.title, "title", { required: true });
  const slug = slugify(getString(payload.slug, "slug") || title);
  const content = getString(payload.content, "content", { required: true });
  const status: BlogStatus =
    payload.status === "published" ? "published" : "draft";
  const publishedAt = getString(payload.published_at, "published_at");

  if (status === "published" && publishedAt && Number.isNaN(Date.parse(publishedAt))) {
    throw new BlogInputError("La date de publication est invalide.");
  }

  if (!slug) {
    throw new BlogInputError("Le slug de l'article est obligatoire.");
  }

  return {
    title,
    slug,
    excerpt: optionalString(getString(payload.excerpt, "excerpt")),
    content,
    cover_image_url: getCoverImageUrl(
      getString(payload.cover_image_url, "cover_image_url"),
    ),
    cover_image_source: optionalString(
      getString(payload.cover_image_source, "cover_image_source"),
    ),
    status,
    published_at:
      status === "published"
        ? publishedAt || new Date().toISOString()
        : null,
  };
}

export const getPublishedBlogPosts = unstable_cache(
  () => queryArticles<BlogPostPreview>(
    `SELECT ${PUBLIC_FIELDS} FROM public.articles
     WHERE status = 'published'
     ORDER BY published_at DESC NULLS LAST, created_at DESC`,
  ),
  ["neon-published-blog-posts"],
  { revalidate: 60, tags: [BLOG_CACHE_TAG] },
);

export const getPublishedBlogPostBySlug = unstable_cache(
  async (slug: string) => {
    const posts = await queryArticles<BlogPost>(
      `SELECT ${ARTICLE_FIELDS} FROM public.articles
       WHERE slug = $1 AND status = 'published' LIMIT 1`,
      [slug],
    );

    return posts[0] ?? null;
  },
  ["neon-published-blog-post"],
  { revalidate: 60, tags: [BLOG_CACHE_TAG] },
);

export async function getAllBlogPosts() {
  return queryArticles<BlogPost>(
    `SELECT ${ARTICLE_FIELDS} FROM public.articles
     ORDER BY updated_at DESC, created_at DESC`,
  );
}

export async function createBlogPost(input: unknown) {
  const payload = sanitizeBlogPostPayload(input);
  const posts = await queryArticles<BlogPost>(
    `INSERT INTO public.articles
     (title, slug, excerpt, content, cover_image_url, cover_image_source, status, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${ARTICLE_FIELDS}`,
    [payload.title, payload.slug, payload.excerpt, payload.content,
      payload.cover_image_url, payload.cover_image_source, payload.status, payload.published_at],
  );

  return posts[0];
}

export async function updateBlogPost(id: string, input: unknown) {
  const payload = sanitizeBlogPostPayload(input);
  const posts = await queryArticles<BlogPost>(
    `UPDATE public.articles SET
     title = $1, slug = $2, excerpt = $3, content = $4,
     cover_image_url = $5, cover_image_source = $6, status = $7, published_at = $8
     WHERE id = $9 RETURNING ${ARTICLE_FIELDS}`,
    [payload.title, payload.slug, payload.excerpt, payload.content,
      payload.cover_image_url, payload.cover_image_source, payload.status, payload.published_at, id],
  );

  if (!posts[0]) {
    throw new BlogInputError("Cet article est introuvable.");
  }

  return posts[0];
}

export async function deleteBlogPost(id: string) {
  await queryArticles<{ id: string }>(
    "DELETE FROM public.articles WHERE id = $1 RETURNING id",
    [id],
  );
}
